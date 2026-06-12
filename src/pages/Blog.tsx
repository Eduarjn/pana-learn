export default function Blog() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pana-bg font-inter px-6">
      <div className="text-center max-w-md">
        <img src="/brand/panalearn-mark-color.png" alt="" className="w-16 h-16 mx-auto mb-6" />
        <h1 className="font-quicksand text-3xl font-bold text-pana-indigo mb-3">Blog em breve</h1>
        <p className="text-pana-text-secondary mb-8">
          Estamos preparando conteúdo sobre e-learning, gestão de aprendizado e cases de clientes. Volte em breve.
        </p>
        <a
          href="/"
          className="inline-block bg-pana-teal hover:bg-pana-teal-dark text-white rounded-xl px-6 h-11 leading-[44px] font-medium"
        >
          Voltar para o início
        </a>
      </div>
    </div>
  );
}
