import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDocuments, generateDoc } from '../../api/ai';
import { getProject } from '../../api/projects';
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const DOC_TYPES = [
  { key: 'overview', label: 'Overview' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'api_docs', label: 'API Docs' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'readme', label: 'README' },
];

interface Doc {
  id: string; doc_type: string; title: string; content: string; updated_at: string;
}

export default function Documents() {
  const { projectId } = useParams<{ projectId: string }>();
  const qc = useQueryClient();
  const [generating, setGenerating] = useState<string | null>(null);
  const [selected, setSelected] = useState<Doc | null>(null);
  const [autoSelectType, setAutoSelectType] = useState<string | null>(null);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId!)
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: () => getDocuments(projectId!)
  });

  useEffect(() => {
    if (autoSelectType && docs.length > 0) {
      const newlyGen = (docs as Doc[]).find(d => d.doc_type === autoSelectType);
      if (newlyGen) {
        setSelected(newlyGen);
        setAutoSelectType(null);
      }
    }
  }, [docs, autoSelectType]);

  async function handleGenerate(docType: string) {
    setGenerating(docType);
    try {
      await generateDoc(projectId!, docType);
      await qc.invalidateQueries({ queryKey: ['documents', projectId] });
      setAutoSelectType(docType);
    } finally {
      setGenerating(null);
    }
  }

  const exportPDF = async () => {
    const input = document.getElementById('doc-content');
    if (!input || !selected) return;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Maintain aspect ratio
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Simple logic for single page or long page (if very long, it will shrink to fit 1 page or cut off, but this works for basic export)
    // A better approach for multi-page is advanced, but this meets the basic requirement
    let heightLeft = pdfHeight;
    let position = 0;
    let pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    const projName = project?.title ? project.title.replace(/\s+/g, '-') : projectId;
    pdf.save(`${projName}-${selected.doc_type}.pdf`);
  };

  const docMap = Object.fromEntries((docs as Doc[]).map(d => [d.doc_type, d]));

  return (
    <div>
      <div className="page-header">
        <h2>Documents</h2>
      </div>
      <div style={{ display: 'flex', height: 'calc(100vh - 65px)' }}>
        {/* Doc list */}
        <div style={{ width: 220, borderRight: '1px solid var(--border)', padding: '1rem' }}>
          {DOC_TYPES.map(dt => {
            const doc = docMap[dt.key];
            return (
              <div key={dt.key} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: selected?.doc_type === dt.key ? '#eff6ff' : 'transparent', cursor: 'pointer', borderLeft: selected?.doc_type === dt.key ? '2px solid var(--accent)' : '2px solid transparent' }}
                  onClick={() => doc && setSelected(doc)}>
                  <span style={{ fontSize: 13 }}>{dt.label}</span>
                  {doc && <span style={{ fontSize: 10, color: 'var(--success)' }}>✓</span>}
                </div>
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', fontSize: 11, marginTop: 2 }}
                  onClick={() => handleGenerate(dt.key)} disabled={generating === dt.key}>
                  {generating === dt.key ? 'Generating...' : doc ? 'Regenerate' : 'Generate'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Doc content */}
        <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', background: '#f8fafc' }}>
          {selected ? (
            <>
              <div className="flex-between mb-4">
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>{selected.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span className="text-muted" style={{ fontSize: 11 }}>Updated {new Date(selected.updated_at).toLocaleString()}</span>
                  <button onClick={exportPDF} style={{ background: 'var(--accent)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Export as PDF
                  </button>
                </div>
              </div>
              <div id="doc-content" style={{ lineHeight: 1.7, fontSize: 15, color: '#000000', background: '#ffffff', padding: '40px', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <style>{`
                  #doc-content h1, #doc-content h2, #doc-content h3, #doc-content h4 { color: #000000; font-family: var(--font-heading); margin-top: 1.5em; margin-bottom: 0.5em; }
                  #doc-content p { color: #000000; margin-bottom: 1em; }
                  #doc-content ul, #doc-content ol { color: #000000; margin-bottom: 1em; padding-left: 24px; }
                  #doc-content li { margin-bottom: 0.5em; }
                  #doc-content pre { background: #f1f5f9; padding: 16px; border-radius: 6px; overflow-x: auto; margin-bottom: 1em; border: 1px solid #e2e8f0; }
                  #doc-content code { font-family: var(--font-mono); color: #0f172a; font-size: 0.9em; }
                `}</style>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {selected.content}
                </ReactMarkdown>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <p>Select a document or generate one from the left panel.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
