import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { data: info } = await supabase.from('project_info').select('*').single();
    const { data: report } = await supabase.from('report_content').select('*').order('order_index', { ascending: true });
    const { data: timeline } = await supabase.from('timeline_events').select('*').order('date', { ascending: true });
    const { data: bom } = await supabase.from('bom_items').select('*').order('id', { ascending: true });
    const { data: slides } = await supabase.from('slides').select('*').order('order_index', { ascending: true });

    res.status(200).json({ info, report, timeline, bom, slides });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
