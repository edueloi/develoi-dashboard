export default function Footer() {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-aurora-blue to-aurora-purple rounded flex items-center justify-center font-bold text-[10px] text-white">
              D
            </div>
            <span className="text-lg font-bold font-display tracking-tighter">DEVELOI</span>
          </div>

          <div className="flex gap-8 text-sm text-neutral-500">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>

          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} Develoi. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
