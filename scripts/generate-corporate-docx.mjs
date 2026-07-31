import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx'
import {
  COMPANY,
  CONCLUSION_PARAGRAPHS,
  CONCLUSION_TAGLINE,
  CORE_VALUES_ROWS,
  LETTER,
  SERVICES,
  STAFF,
  WHY_MSG_BULLETS,
} from './corporate-data.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'docs', 'corporate')
const logoPath = path.join(root, 'public', 'logo.png')

const GOLD = 'C9A24B'
const BRONZE = '4A3F2F'
const MUTED = '5C5348'
const INK = '1A1510'

const COMPANY_DETAILS_ROWS = [
  ['Company Name', COMPANY.name],
  ['Legal Form', COMPANY.legalForm],
  ['Registration Number', COMPANY.registration],
  ['Country of Incorporation', COMPANY.country],
  ['Head Office', COMPANY.headOffice],
  ['Operational Area', COMPANY.operationalArea],
  ['Business Type', COMPANY.businessType],
  ['Registered Office', COMPANY.address],
]

const CONTACT_ROWS = [
  ['General Email', COMPANY.email],
  ['Chief Executive Officer', `${STAFF[0].name} — ${STAFF[0].phone}`],
  ['Registered Office', COMPANY.address],
]

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
  left: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
  right: { style: BorderStyle.SINGLE, size: 6, color: GOLD },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E8DCC4' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E8DCC4' },
}

const INFO_LABEL_WIDTH = 2800
const INFO_VALUE_WIDTH = 6560
const STAFF_COL_WIDTHS = [2600, 4200, 2560]
const VALUES_COL_WIDTHS = [4680, 4680]
const CELL_MARGIN = { top: 100, bottom: 100, left: 160, right: 160 }

function text(content, opts = {}) {
  return new TextRun({
    text: content,
    font: opts.font ?? 'Calibri',
    size: opts.size ?? 22,
    color: opts.color ?? INK,
    bold: opts.bold,
    italics: opts.italics,
  })
}

function serif(content, opts = {}) {
  return text(content, { ...opts, font: 'Georgia' })
}

function para(children, opts = {}) {
  const runs = typeof children === 'string' ? [text(children, opts)] : children
  return new Paragraph({
    children: runs,
    spacing: {
      after: opts.after ?? 160,
      before: opts.before ?? 0,
      line: opts.line ?? 276,
    },
    alignment: opts.alignment,
    indent: opts.indent,
    border: opts.border,
    shading: opts.shading,
  })
}

function heading(content, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    children: [serif(content, { size: level === HeadingLevel.HEADING_1 ? 32 : 26, bold: true, color: BRONZE })],
    spacing: { before: level === HeadingLevel.HEADING_1 ? 120 : 260, after: 140 },
    border: {
      bottom: { color: GOLD, size: 6, style: BorderStyle.SINGLE, space: 4 },
    },
  })
}

function subheading(content) {
  return new Paragraph({
    children: [serif(content, { size: 24, bold: true, color: BRONZE })],
    spacing: { before: 220, after: 100 },
  })
}

function overviewBlock(content) {
  return new Paragraph({
    children: [text(content, { size: 23 })],
    spacing: { after: 220 },
    indent: { left: 220 },
    border: {
      left: { color: GOLD, size: 18, style: BorderStyle.SINGLE, space: 12 },
    },
    shading: { fill: 'FAF8F4' },
  })
}

function label(content) {
  return para([text(content.toUpperCase(), { size: 18, color: GOLD, bold: true })], { after: 80 })
}

function bullet(content) {
  return new Paragraph({
    children: [text(content)],
    bullet: { level: 0 },
    spacing: { after: 80 },
  })
}

function goldRule() {
  return new Paragraph({
    border: { bottom: { color: GOLD, size: 12, style: BorderStyle.SINGLE, space: 1 } },
    spacing: { after: 200 },
  })
}

function buildHeader(variant = 'profile') {
  const logoData = fs.readFileSync(logoPath)
  const subtitleLine =
    variant === 'letter'
      ? `Co. Reg. No. ${COMPANY.registration}`
      : COMPANY.name

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 1400, type: WidthType.DXA },
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: [
                      new ImageRun({
                        data: logoData,
                        transformation: { width: 56, height: 56 },
                        type: 'png',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                children: [
                  para([serif(COMPANY.shortName, { size: 30, bold: true, color: BRONZE })], { after: 40 }),
                  para([text(subtitleLine, { size: 16, color: MUTED })], { after: 40 }),
                  para([text(COMPANY.tagline, { size: 20, italics: true, color: GOLD })], { after: 80 }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function buildFooter(left, right) {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { color: 'E8DCC4', size: 6, style: BorderStyle.SINGLE, space: 4 } },
        spacing: { before: 80 },
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E8DCC4' },
        },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 55, type: WidthType.PERCENTAGE },
                shading: { fill: 'FAF8F4' },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [para([text(left, { size: 16, color: MUTED })], { after: 0 })],
              }),
              new TableCell({
                width: { size: 45, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 160, right: 160 },
                children: [
                  new Paragraph({
                    children: [text(right, { size: 16, color: MUTED })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function infoLabelCell(label) {
  return new TableCell({
    width: { size: INFO_LABEL_WIDTH, type: WidthType.DXA },
    shading: { fill: 'FAF8F4' },
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGIN,
    children: [
      para([text(label, { size: 18, color: BRONZE, bold: true })], { after: 0, line: 240 }),
    ],
  })
}

function infoValueCell(value) {
  return new TableCell({
    width: { size: INFO_VALUE_WIDTH, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGIN,
    children: [para([text(value ?? '', { size: 21 })], { after: 0, line: 276 })],
  })
}

function infoTable(rows) {
  return new Table({
    width: { size: INFO_LABEL_WIDTH + INFO_VALUE_WIDTH, type: WidthType.DXA },
    columnWidths: [INFO_LABEL_WIDTH, INFO_VALUE_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [infoLabelCell(label), infoValueCell(value)],
      }),
    ),
  })
}

function valuesTable(rows) {
  return new Table({
    width: { size: VALUES_COL_WIDTHS[0] + VALUES_COL_WIDTHS[1], type: WidthType.DXA },
    columnWidths: VALUES_COL_WIDTHS,
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: BRONZE },
            margins: CELL_MARGIN,
            children: [para([text('Core Values', { size: 17, color: 'FFFFFF', bold: true })], { after: 0 })],
          }),
        ],
      }),
      ...rows.map(([left, right], index) =>
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: index % 2 === 0 ? 'FAF8F4' : 'FFFFFF' },
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGIN,
              children: [para([text(left, { size: 20, bold: true, color: BRONZE })], { after: 0 })],
            }),
            new TableCell({
              shading: { fill: index % 2 === 0 ? 'FAF8F4' : 'FFFFFF' },
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGIN,
              children: [para([text(right, { size: 20, bold: true, color: BRONZE })], { after: 0 })],
            }),
          ],
        }),
      ),
    ],
  })
}

function staffHeaderCell(content, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: BRONZE },
    verticalAlign: VerticalAlign.CENTER,
    margins: CELL_MARGIN,
    children: [para([text(content, { size: 17, color: 'FFFFFF', bold: true })], { after: 0 })],
  })
}

function staffTable(staff) {
  return new Table({
    width: { size: STAFF_COL_WIDTHS.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: STAFF_COL_WIDTHS,
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          staffHeaderCell('Name', STAFF_COL_WIDTHS[0]),
          staffHeaderCell('Position / Role', STAFF_COL_WIDTHS[1]),
          staffHeaderCell('Direct Contact', STAFF_COL_WIDTHS[2]),
        ],
      }),
      ...staff.map((member, index) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: STAFF_COL_WIDTHS[0], type: WidthType.DXA },
              shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'FAF8F4' },
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGIN,
              children: [para([text(member.name, { size: 20, bold: true, color: BRONZE })], { after: 0 })],
            }),
            new TableCell({
              width: { size: STAFF_COL_WIDTHS[1], type: WidthType.DXA },
              shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'FAF8F4' },
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGIN,
              children: [para([text(member.role, { size: 20 })], { after: 0, line: 276 })],
            }),
            new TableCell({
              width: { size: STAFF_COL_WIDTHS[2], type: WidthType.DXA },
              shading: { fill: index % 2 === 0 ? 'FFFFFF' : 'FAF8F4' },
              verticalAlign: VerticalAlign.CENTER,
              margins: CELL_MARGIN,
              children: [para([text(member.phone, { size: 20 })], { after: 0 })],
            }),
          ],
        }),
      ),
    ],
  })
}

function buildCompanyProfile() {
  const logoData = fs.readFileSync(logoPath)

  return new Document({
    creator: COMPANY.shortName,
    title: 'Company Profile',
    description: `${COMPANY.name} — official company profile`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: INK },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 32, bold: true, color: BRONZE, font: 'Georgia' },
          paragraph: { spacing: { before: 240, after: 120 } },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 26, bold: true, color: BRONZE, font: 'Georgia' },
          paragraph: { spacing: { before: 240, after: 100 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1800, after: 300 },
            children: [
              new ImageRun({
                data: logoData,
                transformation: { width: 120, height: 120 },
                type: 'png',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [serif(COMPANY.shortName, { size: 48, bold: true, color: BRONZE })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
            children: [text(COMPANY.tagline, { size: 24, italics: true, color: GOLD })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [text('Corporate Company Profile', { size: 20, bold: true, color: BRONZE })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [text(COMPANY.name, { size: 22, color: MUTED })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [text(`Registration: ${COMPANY.registration}`, { size: 20, color: MUTED })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [text(COMPANY.headOffice, { size: 20, color: MUTED })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 0 },
            children: [text('July 2026', { size: 20, color: MUTED })],
          }),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(`${COMPANY.name}\n${COMPANY.registration}`, 'Company Profile · Page 1'),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          label('Company Profile'),
          heading('Company Overview'),
          overviewBlock(COMPANY.overview),
          subheading('Corporate Information'),
          goldRule(),
          infoTable(COMPANY_DETAILS_ROWS),
          para('', { after: 120 }),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(`${COMPANY.name}\n${COMPANY.registration}`, 'Company Profile · Page 2'),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          heading('Leadership & Management Team', HeadingLevel.HEADING_1),
          para(
            'The following personnel constitute the core leadership and operational team of Market Sphere Group (Pty) Ltd.',
          ),
          staffTable(STAFF),
          para('', { after: 120 }),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(`${COMPANY.name}\n${COMPANY.registration}`, 'Company Profile · Page 3'),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          heading('Vision, Mission & Values', HeadingLevel.HEADING_1),
          subheading('Mission'),
          para([
            text(COMPANY.mission, { bold: true }),
            text(' — equipping individuals, professionals, and communities with the tools, networks, and opportunities to excel in their chosen fields.'),
          ]),
          subheading('Vision'),
          para(COMPANY.vision),
          subheading('Core Values'),
          valuesTable(CORE_VALUES_ROWS),
          para('', { after: 80 }),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(`${COMPANY.name}\n${COMPANY.registration}`, 'Company Profile · Page 4'),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          heading('Our Services', HeadingLevel.HEADING_1),
          para(
            'Market Sphere Group delivers structured, client-focused services designed to create measurable impact for individuals, businesses, and communities.',
          ),
          ...SERVICES.flatMap((service) => [
            new Paragraph({
              children: [serif(service.title, { size: 22, bold: true, color: BRONZE })],
              spacing: { before: 140, after: 40 },
              border: { left: { color: GOLD, size: 12, style: BorderStyle.SINGLE, space: 8 } },
              indent: { left: 180 },
            }),
            para(service.text, { after: 80, indent: { left: 180 }, line: 260 }),
          ]),
          subheading('Digital Marketplace Platform'),
          para(
            'Our online platform connects customers with verified service providers across Botswana. Users can browse by category and location, view detailed provider profiles, and submit enquiries directly through a secure, professionally managed environment.',
            { after: 140, line: 260 },
          ),
          para(
            'Every provider application is reviewed by our team before going live, ensuring quality, trust, and accountability across the network. The platform reflects our commitment to innovation, professionalism, and customer satisfaction.',
            { after: 80, line: 260 },
          ),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(`${COMPANY.name}\n${COMPANY.registration}`, 'Company Profile · Page 5'),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          heading('Why Market Sphere Group', HeadingLevel.HEADING_1),
          ...WHY_MSG_BULLETS.map((item) => bullet(item)),
          heading('Commitment to Compliance & Data Protection', HeadingLevel.HEADING_1),
          para(
            "Market Sphere Group processes personal data in accordance with Botswana's Data Protection Act, 2024. We maintain transparent privacy practices, secure handling of user information, and clear channels for client and provider enquiries.",
            { after: 140, line: 260 },
          ),
          heading('Conclusion', HeadingLevel.HEADING_1),
          ...CONCLUSION_PARAGRAPHS.map((paragraph) => overviewBlock(paragraph)),
        ],
      },
      {
        headers: { default: buildHeader('profile') },
        footers: {
          default: buildFooter(
            `${COMPANY.name}\n${COMPANY.address}`,
            `Company Profile · Page 6\n${COMPANY.email} · ${STAFF[0].phone}`,
          ),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 900, left: 900 },
          },
        },
        children: [
          heading('Contact Information', HeadingLevel.HEADING_1),
          infoTable(CONTACT_ROWS),
          para([text(CONCLUSION_TAGLINE, { italics: true, color: GOLD, bold: true })], {
            alignment: AlignmentType.CENTER,
            before: 360,
            after: 120,
          }),
          para('', { after: 80 }),
        ],
      },
    ],
  })
}

function buildLetterhead() {
  const letterMetaTable = new Table({
    width: { size: INFO_LABEL_WIDTH + INFO_VALUE_WIDTH, type: WidthType.DXA },
    columnWidths: [INFO_LABEL_WIDTH, INFO_VALUE_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          infoLabelCell('Date'),
          infoValueCell(LETTER.date),
        ],
      }),
      new TableRow({
        children: [
          infoLabelCell('Our Reference'),
          infoValueCell(LETTER.reference),
        ],
      }),
    ],
  })

  const recipientBlock = new Table({
    width: { size: INFO_LABEL_WIDTH + INFO_VALUE_WIDTH, type: WidthType.DXA },
    columnWidths: [INFO_LABEL_WIDTH + INFO_VALUE_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'FAF8F4' },
            margins: CELL_MARGIN,
            children: [
              para([text('The Selection Committee', { bold: true, color: BRONZE })], { after: 40 }),
              para('National Branding Recognition Programme', { after: 40 }),
              para('Gaborone, Botswana', { after: 0 }),
            ],
          }),
        ],
      }),
    ],
  })

  const subjectTable = new Table({
    width: { size: INFO_LABEL_WIDTH + INFO_VALUE_WIDTH, type: WidthType.DXA },
    columnWidths: [INFO_LABEL_WIDTH + INFO_VALUE_WIDTH],
    layout: TableLayoutType.FIXED,
    borders: TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F5EAD4' },
            margins: CELL_MARGIN,
            children: [
              para(
                [
                  text('RE: ', { bold: true, color: BRONZE }),
                  text('Application for National Branding Recognition — Market Sphere Group (Pty) Ltd', {
                    bold: true,
                    color: BRONZE,
                  }),
                ],
                { after: 0, line: 276 },
              ),
            ],
          }),
        ],
      }),
    ],
  })

  const signatureTable = new Table({
    width: { size: 4200, type: WidthType.DXA },
    columnWidths: [4200],
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: BRONZE },
      bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 120, bottom: 0, left: 0, right: 0 },
            children: [
              para([text(STAFF[0].name, { size: 22, bold: true, color: BRONZE })], { after: 40 }),
              para('Chief Executive Officer', { after: 40 }),
              para(COMPANY.name, { after: 0 }),
            ],
          }),
        ],
      }),
    ],
  })

  return new Document({
    creator: COMPANY.shortName,
    title: 'Official Letterhead',
    description: `${COMPANY.name} — official letterhead`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: INK },
        },
      },
    },
    sections: [
      {
        headers: { default: buildHeader('letter') },
        footers: {
          default: buildFooter(
            `Registered Office\n${COMPANY.address}`,
            `Email: ${COMPANY.email}\nTel: ${STAFF[0].phone}`,
          ),
        },
        properties: {
          page: {
            margin: { top: 1080, right: 900, bottom: 1080, left: 900 },
          },
        },
        children: [
          letterMetaTable,
          para('', { after: 200 }),
          recipientBlock,
          para('', { after: 200 }),
          subjectTable,
          para('', { after: 220 }),
          para([text(LETTER.salutation, { bold: true, color: BRONZE })], { after: 200 }),
          para(
            `We write to formally submit our application for consideration under the National Branding Recognition Programme on behalf of ${COMPANY.name} (Registration No. ${COMPANY.registration}), a privately owned, profit-oriented company headquartered in Gaborone, Botswana.`,
            { after: 200, line: 360 },
          ),
          para(LETTER.servicesParagraph, { after: 200, line: 360 }),
          para(
            'Enclosed herewith please find our Corporate Company Profile, which provides a comprehensive overview of our registration details, leadership team, vision and values, service offerings, and contact information. We believe our brand represents professionalism, community impact, and forward-looking enterprise aligned with Botswana\'s national development priorities.',
            { after: 200, line: 360 },
          ),
          para(LETTER.brandParagraph, { after: 200, line: 360 }),
          para(
            'We welcome the opportunity to present our work further and remain available for any additional documentation or clarification required by your office. Thank you for your time and consideration.',
            { after: 200, line: 360 },
          ),
          para('Yours faithfully,', { before: 280, after: 520 }),
          signatureTable,
        ],
      },
    ],
  })
}

async function writeDoc(doc, filename) {
  const buffer = await Packer.toBuffer(doc)
  const filePath = path.join(outDir, filename)
  const candidates = [
    filePath,
    filePath.replace('.docx', '-updated.docx'),
    filePath.replace('.docx', `-${Date.now()}.docx`),
  ]

  for (let i = 0; i < candidates.length; i += 1) {
    const target = candidates[i]
    try {
      fs.writeFileSync(target, buffer)
      console.log(`Created ${target}`)
      if (i > 0) {
        console.log(`(Close Word and re-run to overwrite ${filename})`)
      }
      return target
    } catch (error) {
      if (error?.code !== 'EBUSY' || i === candidates.length - 1) {
        throw error
      }
    }
  }
}

fs.mkdirSync(outDir, { recursive: true })
await writeDoc(buildCompanyProfile(), 'Market-Sphere-Group-Company-Profile.docx')
await writeDoc(buildLetterhead(), 'Market-Sphere-Group-Letterhead.docx')
