import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, cnpj } = await req.json();

    if (action === 'list') {
      // Fetch list of all companies from CVM
      const response = await fetch('https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv');
      const csvText = await response.text();

      // Parse CSV
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(';').map(h => h.trim());

      const companies = [];
      for (let i = 1; i < Math.min(lines.length, 500); i++) {
        const values = lines[i].split(';');
        const company = {};
        headers.forEach((header, index) => {
          company[header] = values[index]?.trim() || '';
        });

        if (company.CNPJ_CIA && company.DENOM_SOCIAL) {
          companies.push({
            cnpj: company.CNPJ_CIA,
            name: company.DENOM_SOCIAL,
            tradingName: company.DENOM_COMERC || company.DENOM_SOCIAL,
            status: company.SIT,
            registrationDate: company.DT_REG,
            sector: company.SETOR_ATIV || 'Não especificado',
            category: company.CATEG_REG || 'Categoria A'
          });
        }
      }

      return Response.json({
        success: true,
        companies: companies.slice(0, 100),
        total: companies.length
      });
    }

    if (action === 'details' && cnpj) {
      // Fetch detailed info for a specific company
      const response = await fetch('https://dados.cvm.gov.br/dados/CIA_ABERTA/CAD/DADOS/cad_cia_aberta.csv');
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(';').map(h => h.trim());

      let companyDetails = null;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(';');
        const company = {};
        headers.forEach((header, index) => {
          company[header] = values[index]?.trim() || '';
        });

        if (company.CNPJ_CIA === cnpj) {
          companyDetails = {
            cnpj: company.CNPJ_CIA,
            name: company.DENOM_SOCIAL,
            tradingName: company.DENOM_COMERC || company.DENOM_SOCIAL,
            status: company.SIT,
            registrationDate: company.DT_REG,
            sector: company.SETOR_ATIV || 'Não especificado',
            category: company.CATEG_REG || 'Categoria A',
            website: company.SITE || '',
            city: company.MUN || '',
            state: company.UF || ''
          };
          break;
        }
      }

      if (!companyDetails) {
        return Response.json({ error: 'Company not found' }, { status: 404 });
      }

      return Response.json({ success: true, company: companyDetails });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});