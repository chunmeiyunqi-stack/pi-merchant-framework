"""
示例数据插入脚本

用法：
  export DATABASE_URL=postgresql://user:password@localhost:5432/code_quality
  python seed.py
"""

from __future__ import annotations

import os
import uuid

import psycopg2
import psycopg2.extras

psycopg2.extras.register_uuid()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/code_quality",
)


def seed() -> None:
    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn.cursor() as cur:
            # ── 代码片段样例 1：简单的 Express 路由 ──
            code1 = """import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.query('SELECT * FROM users LIMIT 100');
    res.json({ data: users.rows });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000);
"""

            cur.execute(
                """
                INSERT INTO code_snippets (code, language, source_type, lines_of_code)
                VALUES (%s, 'typescript', 'upload', 16)
                RETURNING id
                """,
                (code1,),
            )
            snippet1_id: uuid.UUID = cur.fetchone()[0]
            print(f"  [snippet 1] ID: {snippet1_id}")

            cur.execute(
                """
                INSERT INTO quality_analyses
                    (snippet_id, readability_score, performance_score,
                     standard_score, overall_score, suggestions, strengths, model_used)
                VALUES (%s, 7.50, 6.00, 8.00, 7.17,
                        '["添加输入验证","使用参数化查询"]'::jsonb,
                        '["代码结构清晰","错误处理基本覆盖"]'::jsonb,
                        'LongCat-2.0')
                """,
                (snippet1_id,),
            )
            print("  [analysis 1] created")

            # ── 代码片段样例 2：React 组件 ──
            code2 = """import React, { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data.data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {users.map(u => (
        <li key={u.id}>{u.name} - {u.email}</li>
      ))}
    </ul>
  );
};
"""

            cur.execute(
                """
                INSERT INTO code_snippets (code, language, source_type, file_path, lines_of_code)
                VALUES (%s, 'typescript', 'github', 'src/components/UserList.tsx', 30)
                RETURNING id
                """,
                (code2,),
            )
            snippet2_id: uuid.UUID = cur.fetchone()[0]
            print(f"  [snippet 2] ID: {snippet2_id}")

            cur.execute(
                """
                INSERT INTO quality_analyses
                    (snippet_id, readability_score, performance_score,
                     standard_score, overall_score, suggestions, strengths, model_used)
                VALUES (%s, 8.50, 5.50, 7.00, 7.00,
                        '["避免 useEffect 中的 fetch 竞态","考虑使用 React Query 或 SWR 管理服务端状态"]'::jsonb,
                        '["TypeScript 类型定义良好","组件结构清晰，关注点分离合理"]'::jsonb,
                        'LongCat-2.0')
                """,
                (snippet2_id,),
            )
            print("  [analysis 2] created")

            # ── 代码片段样例 3：Python 工具函数 ──
            code3 = """def parse_config(path):
    import json
    f = open(path)
    d = json.load(f)
    f.close()
    return d

def process(items):
    r = []
    for i in items:
        if i.get('active'):
            r.append(i)
    return r
"""

            cur.execute(
                """
                INSERT INTO code_snippets (code, language, source_type, lines_of_code)
                VALUES (%s, 'python', 'manual', 12)
                RETURNING id
                """,
                (code3,),
            )
            snippet3_id: uuid.UUID = cur.fetchone()[0]
            print(f"  [snippet 3] ID: {snippet3_id}")

            cur.execute(
                """
                INSERT INTO quality_analyses
                    (snippet_id, readability_score, performance_score,
                     standard_score, overall_score, suggestions, strengths, model_used)
                VALUES (%s, 5.00, 4.00, 3.50, 4.17,
                        '["使用 with 语句管理文件上下文","添加类型注解","添加函数文档字符串(docstring)","用列表推导式简化 process 函数"]'::jsonb,
                        '["函数功能单一、职责明确"]'::jsonb,
                        'LongCat-2.0')
                """,
                (snippet3_id,),
            )
            print("  [analysis 3] created")

            # ── 分析任务 ──
            cur.execute(
                """
                INSERT INTO analysis_tasks (task_name, total_count, completed_count, failed_count, status, completed_at)
                VALUES ('Initial batch analysis', 3, 3, 0, 'completed', NOW())
                RETURNING id
                """,
            )
            task_id: uuid.UUID = cur.fetchone()[0]
            print(f"  [task] ID: {task_id}")

            conn.commit()
            print("\nSeed completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    seed()
