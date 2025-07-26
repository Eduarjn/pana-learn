import React, { useState, useRef, useEffect } from 'react';

function ImagensConfig() {
  const [imagens, setImagens] = useState(() => {
    const saved = localStorage.getItem('era-imagens');
    return saved ? JSON.parse(saved) : [];
  });
  const [logoSelecionado, setLogoSelecionado] = useState(() => localStorage.getItem('era-logo') || '');
  const [faviconSelecionado, setFaviconSelecionado] = useState(() => localStorage.getItem('era-favicon') || '');
  const fileInput = useRef(null);

  useEffect(() => {
    localStorage.setItem('era-imagens', JSON.stringify(imagens));
  }, [imagens]);
  useEffect(() => {
    if (logoSelecionado) localStorage.setItem('era-logo', logoSelecionado);
  }, [logoSelecionado]);
  useEffect(() => {
    if (faviconSelecionado) localStorage.setItem('era-favicon', faviconSelecionado);
    // Atualiza favicon na página
    if (faviconSelecionado) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconSelecionado;
    }
  }, [faviconSelecionado]);

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagens((imgs) => [...imgs, ev.target.result]);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-heading font-bold mb-2">Imagens</h2>
      <p className="mb-2 text-sm text-gray-500">Faça upload de imagens para usar como logotipo ou favicon.</p>
      <input
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        ref={fileInput}
        style={{ display: 'none' }}
        onChange={handleUpload}
      />
      <button
        className="btn-primary mb-4"
        onClick={() => fileInput.current && fileInput.current.click()}
      >
        Enviar Imagem
      </button>
      <div className="flex flex-wrap gap-4">
        {imagens.map((img, idx) => (
          <div key={idx} className="flex flex-col items-center border p-2 rounded">
            <img src={img} alt="imagem" className="h-16 w-16 object-contain mb-2 bg-white" />
            <button
              className={`btn-secondary mb-1 ${logoSelecionado === img ? 'ring-2 ring-green-500' : ''}`}
              onClick={() => setLogoSelecionado(img)}
            >Usar como Logotipo</button>
            <button
              className={`btn-secondary ${faviconSelecionado === img ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setFaviconSelecionado(img)}
            >Usar como Favicon</button>
          </div>
        ))}
      </div>
      {logoSelecionado && (
        <div className="mt-4">
          <span className="font-bold">Logotipo atual:</span>
          <img src={logoSelecionado} alt="logo atual" className="h-10 inline ml-2 align-middle" />
        </div>
      )}
      {faviconSelecionado && (
        <div className="mt-2">
          <span className="font-bold">Favicon atual:</span>
          <img src={faviconSelecionado} alt="favicon atual" className="h-6 inline ml-2 align-middle" />
        </div>
      )}
    </div>
  );
}

export default ImagensConfig; 