import * as fs from 'fs';
import * as path from 'path';
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    Header, 
    Footer, 
    PageNumber, 
    TextWrappingType, 
    ImageRun, 
    HeadingLevel,
    BorderStyle
} from 'docx';

/**
 * --- Configuration for Software Copyright ---
 */
const APP_NAME = '先锋人工智能服务框架软件';
const VERSION = 'V2.0.0';
const OWNER = '秦晓望';
const COMPLETION_DATE = '2026年05月';

const SOURCE_CONFIG = {
    scanDirs: [
        'packages/pi-sdk/src',
        'apps/web/src/app',
        'apps/admin/src/app'
    ],
    ignoreDirs: ['node_modules', '.next', 'dist', 'prisma', '__tests__'],
    extensions: ['.ts', '.tsx'],
    maxLines: 3000,
    linesPerPage: 50,
};

const DOC_STYLE = {
    font: 'Courier New',
    fontSize: 20, // 10pt in docx (half-points)
    lineSpacing: 240, // 20pt fixed (1/240 of an inch, or use lineSpacing: 400 for 20pt if 1pt=20)
    // Actually line spacing in docx library is in twips. 1 point = 20 twips. 20pt = 400 twips.
};

const COPYRIGHT_HEADER_TEXT = `/*
 * 软件名称：${APP_NAME}
 * 版本号：${VERSION}
 * 著作权人：${OWNER}
 * 开发完成日期：${COMPLETION_DATE}
 */`;

/** 
 * --- Utility Functions --- 
 */

function getFiles(dir: string, allFiles: string[] = []): string[] {
    if (!fs.existsSync(dir)) return allFiles;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            if (!SOURCE_CONFIG.ignoreDirs.some(d => name.includes(d))) {
                getFiles(name, allFiles);
            }
        } else {
            if (SOURCE_CONFIG.extensions.includes(path.extname(name))) {
                allFiles.push(name);
            }
        }
    }
    return allFiles;
}

function redactAndClean(content: string): string[] {
    // 1. Redaction
    let processed = content
        .replace(/sk-[a-zA-Z0-9]{32,}/g, '[REDACTED]')
        .replace(/Bearer\s+[a-zA-Z0-9._-]+/g, 'Bearer [REDACTED]')
        .replace(/postgresql:\/\/[^\"\']+/g, '[REDACTED]')
        .replace(/process\.env\.[A-Z0-9_]+/g, 'process.env.[REDACTED]');

    // 2. Remove comments
    processed = processed.replace(/\/\*[\s\S]*?\*\//g, ''); // Block comments
    // Single line comments starting at line start
    processed = processed.replace(/^\s*\/\/.*$/gm, '');

    // 3. Heuristic: Remove pure JSX/HTML boilerplate
    // (Optional: can be refined if needed)

    // 4. Split and filter lines
    return processed.split(/\r?\n/)
        .map(line => line.trimEnd())
        .filter(line => line.length > 0); // Remove empty lines
}

/** 
 * --- Document Generation Logic --- 
 */

async function generateSourceCodeDoc() {
    console.log('Extracting source code...');
    let allLines: string[] = [];
    
    // Add file content
    const files = SOURCE_CONFIG.scanDirs.flatMap(dir => getFiles(path.resolve(process.cwd(), dir)));
    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        allLines.push(`// --- File: ${path.relative(process.cwd(), file)} ---`);
        allLines.push(...redactAndClean(content));
    }

    console.log(`Total logic lines extracted: ${allLines.length}`);

    // Slice to 3000 lines
    let finalLines: string[] = [];
    if (allLines.length > 3000) {
        const head = allLines.slice(0, 1500);
        const tail = allLines.slice(-1500);
        finalLines = [...head, ...tail];
    } else {
        finalLines = allLines;
    }

    // Create Doc
    const doc = new Document({
        title: `${APP_NAME} 源代码`,
        sections: [{
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: `${APP_NAME} ${VERSION}`, size: 18, font: '宋体' })],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: '宋体' }),
                            ],
                            alignment: AlignmentType.CENTER,
                        }),
                    ],
                }),
            },
            children: [
                // Copyright Header at first page
                new Paragraph({
                    children: [
                        new TextRun({
                            text: COPYRIGHT_HEADER_TEXT,
                            font: DOC_STYLE.font,
                            size: DOC_STYLE.fontSize,
                        }),
                    ],
                }),
                // Code Content
                ...finalLines.map(line => new Paragraph({
                    children: [
                        new TextRun({
                            text: line,
                            font: DOC_STYLE.font,
                            size: DOC_STYLE.fontSize,
                        }),
                    ],
                    spacing: { line: 400, lineRule: 'atLeast' }, // ~20pt
                })),
            ],
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('copyright-source-code.docx', buffer);
    console.log('Successfully generated copyright-source-code.docx');
    return finalLines.length;
}

async function generateUserManualDoc() {
    console.log('Generating User Manual Doc...');
    const manualPath = path.resolve(process.cwd(), 'docs/user-manual-v2.0.0.md'); // Previous path
    if (!fs.existsSync(manualPath)) {
        console.error('User manual markdown not found.');
        return;
    }

    const content = fs.readFileSync(manualPath, 'utf8');
    const sections = content.split(/^# /gm).filter(s => s.trim().length > 0);

    const docChildren = [];

    // 1. Disclaimer Page
    docChildren.push(new Paragraph({
        children: [new TextRun({ text: '版权声明', bold: true, size: 48, font: '黑体' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2400 },
    }));
    docChildren.push(new Paragraph({
        children: [new TextRun({ 
            text: `本软件“${APP_NAME} ${VERSION}”由著作权人${OWNER}独立开发，拥有完整著作权。\n未经著作权人书面许可，任何单位或个人不得以任何形式复制、传播、修改或使用本软件的全部或部分内容。\n© 2026 ${OWNER} 版权所有`,
            size: 24,
            font: '宋体'
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 1000 },
    }));

    // 2. Main Content (Naive parser)
    sections.forEach(section => {
        const lines = section.split(/\r?\n/);
        const title = lines[0].trim();
        
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: title, bold: true, size: 36, font: '黑体' })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
        }));

        lines.slice(1).forEach(line => {
            if (line.startsWith('## ')) {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line.replace('## ', ''), bold: true, size: 32, font: '黑体' })],
                    heading: HeadingLevel.HEADING_2,
                }));
            } else if (line.startsWith('### ')) {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line.replace('### ', ''), bold: true, size: 28, font: '黑体' })],
                    heading: HeadingLevel.HEADING_3,
                }));
            } else if (line.trim().length > 0) {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line.trim(), size: 24, font: '宋体' })],
                    spacing: { after: 120 },
                }));
            }
        });
    });

    // 3. Insert Screenshots
    const screenshotDir = path.resolve(process.cwd(), 'docs/screenshots');
    if (fs.existsSync(screenshotDir)) {
        const images = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png')).sort();
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: '附录：软件运行效果图', bold: true, size: 32, font: '黑体' })],
            spacing: { before: 400 },
        }));

        images.forEach((img, index) => {
            const imgPath = path.join(screenshotDir, img);
            const imageData = fs.readFileSync(imgPath);
            docChildren.push(new Paragraph({
                children: [
                    new ImageRun({
                        data: imageData,
                        transformation: { width: 600, height: 400 }, // Scaled down roughly to 15cm
                    }),
                ],
                alignment: AlignmentType.CENTER,
            }));
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `图 ${index + 1}：${img.replace('.png', '')}`, size: 18, font: '宋体' })],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
            }));
        });
    }

    const doc = new Document({
        sections: [{
            headers: {
                default: new Header({
                    children: [new Paragraph({
                        children: [new TextRun({ text: `${APP_NAME} ${VERSION}`, size: 18, font: '宋体' })],
                        alignment: AlignmentType.CENTER,
                    })],
                }),
            },
            footers: {
                default: new Footer({
                    children: [new Paragraph({
                        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, font: '宋体' })],
                        alignment: AlignmentType.CENTER,
                    })],
                }),
            },
            children: docChildren,
        }],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync('user-manual.docx', buffer);
    console.log('Successfully generated user-manual.docx');
}

async function run() {
    process.chdir(path.resolve(__dirname, '..'));
    const lineCount = await generateSourceCodeDoc();
    await generateUserManualDoc();
    console.log(`Final Extraction Summary: Total ${lineCount} lines.`);
}

run().catch(console.error);
