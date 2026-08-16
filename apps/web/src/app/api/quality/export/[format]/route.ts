import { NextRequest, NextResponse } from 'next/server';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

const VALID_FORMATS = ['json', 'csv', 'training', 'report'] as const;
type ExportFormat = (typeof VALID_FORMATS)[number];

const CONTENT_TYPE_MAP: Record<ExportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv; charset=utf-8',
  training: 'application/jsonl',
  report: 'text/markdown',
};

const FILENAME_MAP: Record<ExportFormat, string> = {
  json: 'quality_export.json',
  csv: 'quality_export.csv',
  training: 'training_data.jsonl',
  report: 'quality_report.md',
};

export async function GET(_req: NextRequest, { params }: { params: { format: string } }) {
  const { format } = params;

  if (!VALID_FORMATS.includes(format as ExportFormat)) {
    return NextResponse.json(
      { error: `Invalid export format. Must be one of: ${VALID_FORMATS.join(', ')}` },
      { status: 400 }
    );
  }

  try {
    const searchParams = _req.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const endpoint = format === 'report' ? '/export/report' : `/export/${format}`;
    const url = queryString
      ? `${PYTHON_SERVICE_URL}${endpoint}?${queryString}`
      : `${PYTHON_SERVICE_URL}${endpoint}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || 'Export failed' },
        { status: response.status }
      );
    }

    const data = await response.text();

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': CONTENT_TYPE_MAP[format as ExportFormat],
        'Content-Disposition': `attachment; filename="${FILENAME_MAP[format as ExportFormat]}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
