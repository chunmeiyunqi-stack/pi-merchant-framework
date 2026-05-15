from pypdf import PdfReader, PdfWriter
import os

input_pdf = "Pioneer_AI_Service_Framework_Source_Code.pdf"
output_pdf = "PioneerAI_源代码_软著提交版.pdf"

if not os.path.exists(input_pdf):
    print(f"❌ 找不到文件: {input_pdf}")
    exit()

reader = PdfReader(input_pdf)
total_pages = len(reader.pages)
print(f"📊 PDF 总页数: {total_pages}")

writer = PdfWriter()

if total_pages <= 60:
    print("✅ 总页数不足 60 页，将提取全部内容...")
    for i in range(total_pages):
        writer.add_page(reader.pages[i])
else:
    print("📄 正在提取前 30 页...")
    for i in range(30):
        writer.add_page(reader.pages[i])
    
    print("📄 正在提取后 30 页...")
    for i in range(total_pages - 30, total_pages):
        writer.add_page(reader.pages[i])

with open(output_pdf, "wb") as f:
    writer.write(f)

print(f"✅ 成功！已生成: {output_pdf}")
