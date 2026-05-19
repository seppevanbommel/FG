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
  const fabrikant = getValueFromText(text, 'Fabrikant');
  const model = getValueFromText(text, 'Model');
  const submodel = getValueFromText(text, 'Sub-model');
  const productiedatum = getValueFromText(text, 'Productiedatum');

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
  const lines = text.split('\n');
  let merk = 'BMW';
  let model = 'Onbekend';

  const modelLine = lines.find(l => l.includes('Model:'));
  if (modelLine) {
    model = modelLine.split('Model:')[1]?.trim() || 'Onbekend';
  }

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
  
  let merk = 'Onbekend';
  let model = 'Onbekend';

  const merken = ['BMW', 'Mercedes', 'Porsche', 'Audi', 'Range Rover', 'Land Rover'];
  merken.forEach(m => {
    if (text.includes(m)) merk = m;
  });

  const options = lines
    .filter(l => /^[A-Z0-9]+-|^[\*\-]\s/.test(l.trim()))
    .slice(0, 100);

  const content = buildTXTContent(merk, model, '', '', options)
