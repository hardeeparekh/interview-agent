import React from "react";

export default function Footer() {
  return (
    <footer id="contact" className="py-20 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="text-center md:text-left">
          <h3 className="text-white font-bold text-3xl mb-3 tracking-tight">Let's Connect</h3>
          <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-6 md:mb-0">
            Innovating at the intersection of AI and Software Engineering. Created and maintained by <span className="text-blue-500 font-semibold">Hardee Parekh</span>.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-8">
          <a href="mailto:parekhhardee@gmail.com" className="text-slate-400 hover:text-blue-500 transition-all flex items-center gap-2 text-sm font-medium">Email</a>
          <a href="https://www.linkedin.com/in/hardeeparekh/" target="_blank" className="text-slate-400 hover:text-blue-500 transition-all flex items-center gap-2 text-sm font-medium">LinkedIn</a>
          <a href="https://github.com/hardeeparekh" target="_blank" className="text-slate-400 hover:text-blue-500 transition-all flex items-center gap-2 text-sm font-medium">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
