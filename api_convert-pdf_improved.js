import pdf from 'pdf-parse/lib/pdf-parse.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let fileBuffer;

    // Handle different file upload methods
    if (req.body.file) {
      // Base64 from frontend
      const base64 = req.body.file.split(',')[1] || req.body.file;
      fileBuffer = Buffer.from(base64, 'base64');
    } else if (req.files?.file) {
      fileBuffer = req.files.file.data;
    } else {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Parse PDF
    const pdfData = await pdf(fileBuffer);
    const text = pdfData.text;

    // Detect and parse
    const result = detectAndParsePDF(text);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Conversion failed',
      message: error.message 
    });
  }
}

function detectAndParsePDF(text) {
  const isVWE = text.includes('SilverDAT') || (text.includes('DAT nummer') && text.includes('Fabrikant'));
  const isFactoryInfo = text.includes('Fabrieksinformatie') || text.includes('VIN Equipment');
  const isRangeRover = text.includes('RANGE ROVER');

  if (isVWE) {
    return parseVWEPDF(text);
  } else if (isFactoryInfo) {
    return parseFactoryInfoPDF(text);
  } else if (isRangeRover) {
    return parseRangeRoverPDF(text);
  } else {
    return parseGenericPDF(text);
  }
}

function parseVWEPDF(text) {
  // Extract vehicle info using regex
  const fabrikant = getValueFromText(text, 'Fabrikant');
  const model = getValueFromText(text, 'Model');
  const submodel = getValueFromText(text, 'Sub-model');
  const productiedatum = getValueFromText(text, 'Productiedatum');

  // Find and parse options
  const optiesIndex = text.indexOf('Uitrustinglijst optioneel');
  const optiesText = optiesIndex > -1 ? text.substring(optiesIndex) : text;

  const options = extractOptions(optiesText, 'vwe');

  const content = buildTXTContent(
    fabrikant,
    model,
    submodel,
    productiedatum || new Date().toISOString().split('T')[0],
    options
  );

  return {
    content,
    filename: `${fabrikant}_${normalizeString(model)}_opties.txt`,
    vehicleInfo: `${fabrikant} ${model} ${submodel}`,
  };
}

function parseFactoryInfoPDF(text) {
  // Extract from Factory Info format
  const lines = text.split('\n');
  let merk = 'BMW';
  let model = 'Onbekend';

  // Find model
  const modelLine = lines.find(l => l.includes('Model:'));
  if (modelLine) {
    model = modelLine.split('Model:')[1]?.trim() || 'Onbekend';
  }

  // Detect manufacturer
  if (text.includes('Porsche')) merk = 'Porsche';
  if (text.includes('Mercedes')) merk = 'Mercedes-Benz';
  if (text.includes('Audi')) merk = 'Audi';

  const options = extractOptions(text, 'factory');

  const content = buildTXTContent(
    merk,
    model,
    '',
    new Date().toISOString().split('T')[0],
    options
  );

  return {
    content,
    filename: `${merk}_${normalizeString(model)}_opties.txt`,
    vehicleInfo: `${merk} ${model}`,
  };
}

function parseRangeRoverPDF(text) {
  const lines = text.split('\n');
  
  // Extract model
  let model = 'RANGE ROVER';
  const modelLine = lines.find(l => 
    l.includes('RANGE ROVER') && !l.includes('SPORT') && l.length < 100
  );
  if (modelLine) {
    model = modelLine.replace('RANGE ROVER', '').trim() || 'RANGE ROVER';
  }

  const options = extractOptions(text, 'range-rover');

  const content = buildTXTContent(
    'Land Rover',
    model,
    '',
    new Date().toISOString().split('T')[0],
    options
  );

  return {
    content,
    filename: `Land_Rover_${normalizeString(model)}_opties.txt`,
    vehicleInfo: `Land Rover ${model}`,
  };
}

function parseGenericPDF(text) {
  const lines = text.split('\n').filter(l => l.trim().length > 3);
  
  // Try to extract basic info
  let merk = 'Onbekend';
  let model = 'Onbekend';

  const merken = ['BMW', 'Mercedes', 'Porsche', 'Audi', 'Range Rover', 'Land Rover'];
  merken.forEach(m => {
    if (text.includes(m)) merk = m;
  });

  const options = lines
    .filter(l => /^[A-Z0-9]+-|^[\*\-]\s/.test(l.trim()))
    .slice(0, 100);

  const content = buildTXTContent(merk, model, '', '', options);

  return {
    content,
    filename: `${merk}_${normalizeString(model)}_opties.txt`,
    vehicleInfo: `${merk} ${model}`,
  };
}

function extractOptions(text, type) {
  const options = [];

  if (type === 'vwe') {
    // VWE format: CODE - Description
    const regex = /^([A-Z0-9]{1,8})\s*-\s*(.+)$/gm;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const code = match[1].trim();
      const desc = match[2].trim();
      if (isValidOption(code, desc)) {
        options.push(`${code} - ${desc}`);
      }
    }
  } else if (type === 'factory') {
    // Factory Info format: CODE  DESCRIPTION
    const regex = /^([A-Z0-9]{1,8})\s{2,}(.+?)$/gm;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const code = match[1].trim();
      const desc = match[2].trim();
      if (isValidOption(code, desc)) {
        options.push(`${code} - ${desc}`);
      }
    }
  } else if (type === 'range-rover') {
    // Range Rover format: - Description or Description
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if ((trimmed.startsWith('-') || trimmed.startsWith('•')) && trimmed.length > 5) {
        const desc = trimmed.replace(/^[\-•]\s*/, '').trim();
        if (desc && !desc.includes('RANGE') && !desc.includes('STANDARD')) {
          options.push(`- ${desc}`);
        }
      }
    });
  }

  // Remove duplicates
  return [...new Set(options)];
}

function buildTXTContent(merk, model, submodel, datum, options) {
  let content = '[VOERTUIG]\n';
  content += `Merk=${merk}\n`;
  content += `Model=${model}\n`;
  if (submodel && submodel.trim()) {
    content += `Submodel=${submodel}\n`;
  }
  if (datum && datum.trim()) {
    content += `Productiedatum=${datum}\n`;
  }
  content += '\n[STANDAARD_OPTIES]\n\n[OPTIES]\n';
  
  options.forEach(opt => {
    content += `${opt}\n`;
  });

  return content;
}

function getValueFromText(text, key) {
  const regex = new RegExp(`${key}\\s*(?:\\(.*?\\))?[:\\s]+([^\\n]+)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function isValidOption(code, desc) {
  return (
    code.length > 0 &&
    code.length < 15 &&
    desc.length > 2 &&
    desc.length < 200 &&
    !code.includes('www') &&
    !code.includes('http') &&
    !code.includes('VIN') &&
    !code.includes('DAT') &&
    !desc.includes('http')
  );
}

function normalizeString(str) {
  return str
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase()
    .substring(0, 30);
}
