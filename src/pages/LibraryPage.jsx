
import React, { useEffect, useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog.jsx";
import { useToast } from "@/components/ui/use-toast.js";
import {
  Star, Plus, Search, Trash2, Edit2, Link as LinkIcon, Upload,
  BookOpen, Clapperboard, Tv, GraduationCap, FileText, X
} from "lucide-react";

/* ------------------------------------------
   UTILS: localStorage + ids + imagens
-------------------------------------------*/
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const uid = () => Math.random().toString(36).slice(2, 10);

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

/* ------------------------------------------
   COMPONENTES BASE VISUAIS
-------------------------------------------*/

function SectionHeader({ icon, title, onAdd, total }) {
  const Icon = icon;
  return (
    <div className="flex items-center justify-between pb-3 border-b border-[var(--pc-border)]">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-[var(--pc-primary)]" />
        <h2 className="text-lg font-semibold">{title}</h2>
        {typeof total === "number" && <span className="text-xs text-[var(--pc-muted)]">({total})</span>}
      </div>
      <button onClick={onAdd} className="pc-btn primary flex items-center gap-2">
        <Plus className="w-4 h-4" /> Adicionar
      </button>
    </div>
  );
}

function SearchBar({ value, onChange, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <div className="relative flex-1 min-w-[220px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pc-muted)]" />
        <input
          className="pc-input pl-9 w-full"
          placeholder="Buscar por título, autor/plataforma..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {extra}
    </div>
  );
}

function Stars({ value = 0, onChange, size = 18 }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Avaliação">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={value === n}
          className={`p-0.5 rounded transition hover:scale-110 ${value >= n ? "text-yellow-400" : "text-zinc-300 hover:text-zinc-400"}`}
          onClick={() => onChange && onChange(n)}
          title={`${n} estrelas`}
        >
          <Star size={size} strokeWidth={1.7} fill={value >= n ? "currentColor" : "transparent"} />
        </button>
      ))}
    </div>
  );
}

function EmptyState({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--pc-border)] p-8 text-center text-[var(--pc-muted)]">
      {children}
    </div>
  );
}

/* ------------------------------------------
   CARD ÚNICO (imagem + meta + ações)
-------------------------------------------*/

function MediaCard({ data, onEdit, onDelete, metaLines = [] }) {
  return (
    <div className="pc-card p-0 overflow-hidden group">
      <div className="aspect-[4/3] bg-zinc-100 relative">
        {data.image ? (
          <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full grid place-items-center text-[var(--pc-muted)]">sem capa</div>
        )}
        {!!data.status && (
          <div className="absolute top-2 left-2 rounded-full bg-white/90 border px-2 py-0.5 text-[11px]">
            {data.status}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="font-semibold leading-tight line-clamp-2">{data.title || "Sem título"}</div>
          <Stars value={data.rating || 0} onChange={null} size={14} />
        </div>
        {metaLines?.length > 0 && (
          <div className="mt-1 space-y-0.5 text-[12px] text-[var(--pc-muted)]">
            {metaLines.map((line, i) => (
              <div key={i} className="truncate">{line}</div>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3">
          <button className="pc-btn ghost flex items-center gap-1" onClick={onEdit}>
            <Edit2 className="w-4 h-4" /> editar
          </button>
          <button className="pc-btn danger ghost flex items-center gap-1" onClick={onDelete}>
            <Trash2 className="w-4 h-4" /> excluir
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------
   MODAL GENÉRICO (livro/filme/série/leitura)
-------------------------------------------*/

function labelByKind(kind) {
  switch (kind) {
    case "book": return "Livro";
    case "film": return "Filme";
    case "series": return "Série";
    case "reading": return "Leitura";
    case "course": return "Curso";
    default: return "Item";
  }
}

function MediaEditModal({ open, onClose, initial, kind, onSave, onDelete }) {
  // Campos comuns
  const [title, setTitle] = useState(initial?.title || "");
  const [platform, setPlatform] = useState(initial?.platform || "");
  const [link, setLink] = useState(initial?.link || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageURL, setImageURL] = useState("");
  const [rating, setRating] = useState(initial?.rating || 0);
  const [status, setStatus] = useState(initial?.status || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  // Campos específicos
  const [author, setAuthor] = useState(initial?.author || ""); // livros
  const [season, setSeason] = useState(initial?.season || ""); // séries
  const [year, setYear] = useState(initial?.year || "");       // filmes/séries

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setPlatform(initial?.platform || "");
      setLink(initial?.link || "");
      setImage(initial?.image || "");
      setImageURL("");
      setRating(initial?.rating || 0);
      setStatus(initial?.status || "");
      setNotes(initial?.notes || "");
      setAuthor(initial?.author || "");
      setSeason(initial?.season || "");
      setYear(initial?.year || "");
    }
  }, [open, initial]);

  async function handleUpload(file) {
    const dataUrl = await fileToDataURL(file);
    setImage(dataUrl);
  }

  function onConfirm() {
    const payload = {
      ...(initial || { id: uid(), kind }),
      title: title.trim(),
      platform: platform.trim(),
      link: link.trim(),
      image: image?.trim() || "",
      rating,
      status: status.trim(),
      notes: notes.trim(),
      author: author.trim(),
      season: season.trim(),
      year: year.trim(),
    };
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {labelByKind(kind)}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Título</span>
                <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" />
              </label>

              {kind === "book" && (
                <label className="grid gap-1 text-sm">
                  <span>Autor(a)</span>
                  <input className="pc-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ex.: J.R.R. Tolkien" />
                </label>
              )}

              {(kind === "film" || kind === "series") && (
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="grid gap-1 text-sm">
                    <span>{kind === "series" ? "Temporada" : "Ano"}</span>
                    <input className="pc-input" value={kind === "series" ? season : year} onChange={(e) => (kind === "series" ? setSeason(e.target.value) : setYear(e.target.value))} placeholder={kind === "series" ? "Ex.: 1ª" : "Ex.: 2024"} />
                  </label>
                  {kind === "series" && (
                    <label className="grid gap-1 text-sm">
                      <span>Ano</span>
                      <input className="pc-input" value={year} onChange={(e) => setYear(e.target.value)} placeholder="Ex.: 2024" />
                    </label>
                  )}
                </div>
              )}

              <label className="grid gap-1 text-sm">
                <span>Plataforma / Editora</span>
                <input className="pc-input" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Ex.: Netflix / Kindle / DarkSide" />
              </label>

              <label className="grid gap-1 text-sm">
                <span>Link</span>
                <div className="flex gap-2">
                  <input className="pc-input flex-1" value={link} onChange={(e) => setLink(e.target.value)} placeholder="URL (opcional)" />
                  {link && <a className="pc-btn ghost flex items-center gap-2" href={link} target="_blank" rel="noreferrer">
                    <LinkIcon className="w-4 h-4" /> abrir
                  </a>}
                </div>
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Status</span>
                  <select className="pc-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="">–</option>
                    <option value="planejado">Planejado</option>
                    <option value="lendo/assistindo">Lendo/Assistindo</option>
                    <option value="pausado">Pausado</option>
                    <option value="concluído">Concluído</option>
                    <option value="abandonado">Abandonado</option>
                  </select>
                </label>

                <div className="grid gap-1 text-sm">
                  <span>Avaliação</span>
                  <Stars value={rating} onChange={setRating} />
                </div>
              </div>
            </div>

            {/* imagem */}
            <div className="grid gap-3">
              <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] overflow-hidden">
                <div className="aspect-[4/3] bg-zinc-100">
                  {image ? (
                    <img src={image} alt="Capa" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[var(--pc-muted)] text-sm">sem capa</div>
                  )}
                </div>
                <div className="p-3 grid gap-2">
                  <label className="pc-btn ghost flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Enviar imagem</span>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setImage(await fileToDataURL(f));
                    }} />
                  </label>
                  <div className="flex gap-2">
                    <input className="pc-input flex-1" placeholder="URL da imagem" value={imageURL} onChange={(e) => setImageURL(e.target.value)} />
                    <button className="pc-btn" onClick={() => imageURL && setImage(imageURL)}>Usar URL</button>
                  </div>
                  {image && (
                    <button className="pc-btn danger ghost" onClick={() => setImage("")}>
                      <X className="w-4 h-4" /> remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Notas / Opinião</span>
            <textarea className="pc-textarea min-h-[120px]" placeholder="O que você achou, trechos favoritos, insights..."
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>
        <DialogFooter>
          <button className="pc-btn danger ghost flex items-center gap-2 mr-auto" onClick={onDelete}>
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" disabled={!title.trim()} onClick={onConfirm}>Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------
   MODAL DE CURSO (módulos + datas + anotações)
-------------------------------------------*/

function CourseEditModal({ open, onClose, initial, onSave, onDelete }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [platform, setPlatform] = useState(initial?.platform || "");
  const [link, setLink] = useState(initial?.link || "");
  const [image, setImage] = useState(initial?.image || "");
  const [imageURL, setImageURL] = useState("");
  const [rating, setRating] = useState(initial?.rating || 0);
  const [status, setStatus] = useState(initial?.status || "");
  const [notes, setNotes] = useState(initial?.notes || "");

  const [startAt, setStartAt] = useState(initial?.startAt || "");
  const [endAt, setEndAt] = useState(initial?.endAt || "");
  const [modules, setModules] = useState(initial?.modules || []); // [{id,title,done,notes}]

  // janela de anotações por módulo
  const [openNotesFor, setOpenNotesFor] = useState(null); // {id,title,notes,done}

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || "");
      setPlatform(initial?.platform || "");
      setLink(initial?.link || "");
      setImage(initial?.image || "");
      setImageURL("");
      setRating(initial?.rating || 0);
      setStatus(initial?.status || "");
      setNotes(initial?.notes || "");
      setStartAt(initial?.startAt || "");
      setEndAt(initial?.endAt || "");
      setModules(initial?.modules || []);
      setOpenNotesFor(null);
    }
  }, [open, initial]);

  function addModule() {
    setModules((prev) => [...prev, { id: uid(), title: `Módulo ${prev.length + 1}`, done: false, notes: "" }]);
  }
  function updateModule(id, patch) {
    setModules((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeModule(id) {
    setModules((prev) => prev.filter((m) => m.id !== id));
  }

  function onConfirm() {
    const payload = {
      ...(initial || { id: uid(), kind: "course" }),
      title: title.trim(),
      platform: platform.trim(),
      link: link.trim(),
      image: image?.trim() || "",
      rating,
      status: status.trim(),
      notes: notes.trim(),
      startAt: startAt || "",
      endAt: endAt || "",
      modules,
    };
    onSave(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid sm:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span>Título</span>
                <input className="pc-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nome do curso" />
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Plataforma</span>
                  <input className="pc-input" value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="Ex.: Hotmart, Udemy, etc." />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Link</span>
                  <div className="flex gap-2">
                    <input className="pc-input flex-1" value={link} onChange={(e) => setLink(e.target.value)} placeholder="URL do curso" />
                    {link && (
                      <a className="pc-btn ghost flex items-center gap-2" href={link} target="_blank" rel="noreferrer">
                        <LinkIcon className="w-4 h-4" /> abrir
                      </a>
                    )}
                  </div>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Início</span>
                  <input className="pc-input" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </label>
                <label className="grid gap-1 text-sm">
                  <span>Conclusão</span>
                  <input className="pc-input" type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </label>
              </div>

              <label className="grid gap-1 text-sm">
                <span>Status</span>
                <select className="pc-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">–</option>
                  <option value="planejado">Planejado</option>
                  <option value="estudando">Estudando</option>
                  <option value="pausado">Pausado</option>
                  <option value="concluído">Concluído</option>
                </select>
              </label>

              <div className="grid gap-1 text-sm">
                <span>Avaliação</span>
                <Stars value={rating} onChange={setRating} />
              </div>
            </div>

            {/* imagem */}
            <div className="grid gap-3">
              <div className="rounded-xl border border-[var(--pc-border)] bg-[var(--pc-surface)] overflow-hidden">
                <div className="aspect-[4/3] bg-zinc-100">
                  {image ? (
                    <img src={image} alt="Capa do curso" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-[var(--pc-muted)] text-sm">sem capa</div>
                  )}
                </div>
                <div className="p-3 grid gap-2">
                  <label className="pc-btn ghost flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Enviar imagem</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setImage(await fileToDataURL(f));
                      }}
                    />
                  </label>
                  <div className="flex gap-2">
                    <input className="pc-input flex-1" placeholder="URL da imagem" value={imageURL} onChange={(e) => setImageURL(e.target.value)} />
                    <button className="pc-btn" onClick={() => imageURL && setImage(imageURL)}>Usar URL</button>
                  </div>
                  {image && (
                    <button className="pc-btn danger ghost" onClick={() => setImage("")}>
                      <X className="w-4 h-4" /> remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* módulos */}
          <div className="pc-card">
            <div className="flex items-center justify-between">
              <h3 className="pc-title flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-500" />
                Módulos
              </h3>
              <button className="pc-btn ghost" onClick={addModule}>
                <Plus className="w-4 h-4" /> adicionar módulo
              </button>
            </div>

            <div className="mt-3 grid gap-2">
              {modules.length === 0 && <div className="text-sm text-[var(--pc-muted)]">Nenhum módulo ainda.</div>}

              {modules.map((m) => (
                <div key={m.id} className="rounded-lg border border-[var(--pc-border)] p-3 bg-white grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    {/* título com duplo clique para abrir notas */}
                    <input
                      className="pc-input"
                      value={m.title}
                      onChange={(e) => updateModule(m.id, { title: e.target.value })}
                      onDoubleClick={() => setOpenNotesFor(m)}
                      placeholder="Título do módulo"
                      title="Duplo clique para abrir anotações"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        className="text-xs underline text-zinc-700 hover:text-zinc-900"
                        onClick={() => setOpenNotesFor(m)}
                        title="Abrir anotações"
                      >
                        anotações
                      </button>
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!m.done}
                          onChange={(e) => updateModule(m.id, { done: e.target.checked })}
                        />
                        <span>Concluído</span>
                      </label>
                      <button className="pc-btn danger ghost" onClick={() => removeModule(m.id)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* resumo das notas (preview) */}
                  {m.notes ? (
                    <div className="text-[12px] text-[var(--pc-muted)] line-clamp-2">
                      {m.notes}
                    </div>
                  ) : (
                    <div className="text-[12px] text-[var(--pc-muted)] italic">Sem anotações</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <label className="grid gap-1 text-sm">
            <span>Notas gerais</span>
            <textarea className="pc-textarea min-h-[120px]" placeholder="Observações gerais do curso…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        <DialogFooter>
          <button className="pc-btn danger ghost flex items-center gap-2 mr-auto" onClick={onDelete}>
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" disabled={!title.trim()} onClick={onConfirm}>Salvar</button>
        </DialogFooter>
      </DialogContent>

      {/* janela de anotações do módulo */}
      {openNotesFor && (
        <ModuleNotesDialog
          moduleItem={openNotesFor}
          onClose={() => setOpenNotesFor(null)}
          onSave={(notesText) => {
            updateModule(openNotesFor.id, { notes: notesText });
            setOpenNotesFor(null);
          }}
        />
      )}
    </Dialog>
  );
}

/* ------------------------------------------
   DIALOG DE ANOTAÇÕES DE MÓDULO
-------------------------------------------*/

function ModuleNotesDialog({ moduleItem, onClose, onSave }) {
  const [text, setText] = useState(moduleItem?.notes || "");

  return (
    <Dialog open={!!moduleItem} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anotações — {moduleItem.title || "Módulo"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="text-sm text-[var(--pc-muted)]">
            Escreva aqui os resumos, insights ou tarefas relacionadas a este módulo.
          </div>
          <textarea
            className="pc-textarea min-h-[220px]"
            placeholder="Suas anotações…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <button className="pc-btn ghost">Cancelar</button>
          </DialogClose>
          <button className="pc-btn primary" onClick={() => onSave(text)}>Salvar</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------
   LIST SECTION (cada aba)
-------------------------------------------*/

function ListSection({ kind, icon, storeKey }) {
  const { toast } = useToast();
  const [items, setItems] = useState(() => store.get(storeKey, []));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editing, setEditing] = useState(null); // item
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    store.set(storeKey, items);
  }, [items, storeKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (statusFilter && (it.status || "") !== statusFilter) return false;
      if (!q) return true;
      const hay = `${it.title || ""} ${it.author || ""} ${it.platform || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [items, query, statusFilter]);

  function addBlank() {
    const blank = { id: uid(), kind, title: "", rating: 0, platform: "", status: "", notes: "" };
    setItems((prev) => [blank, ...prev]);
    setEditing(blank);
  }

  function saveItem(payload) {
    setItems((prev) => {
      const exists = prev.some((x) => x.id === payload.id);
      const next = exists ? prev.map((x) => (x.id === payload.id ? payload : x)) : [payload, ...prev];
      return next;
    });
    toast({ title: `${labelByKind(kind)} salvo!` });
    setEditing(null);
  }

  function confirmDelete() {
    if (!deletingId) return;
    setItems((prev) => prev.filter((x) => x.id !== deletingId));
    toast({ title: "Excluído com sucesso." });
    setDeletingId(null);
    setEditing(null);
  }

  return (
    <div className="grid gap-3">
      <SectionHeader icon={icon} title={`${labelByKind(kind)}s`} onAdd={addBlank} total={items.length} />
      <SearchBar
        value={query}
        onChange={setQuery}
        extra={
          <select className="pc-input w-[180px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="planejado">Planejado</option>
            <option value="lendo/assistindo">Lendo/Assistindo</option>
            <option value="estudando">Estudando</option>
            <option value="pausado">Pausado</option>
            <option value="concluído">Concluído</option>
            <option value="abandonado">Abandonado</option>
          </select>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState>
          Nenhum {labelByKind(kind).toLowerCase()} encontrado. Clique em <b>Adicionar</b> para criar.
        </EmptyState>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((it) => (
            <MediaCard
              key={it.id}
              data={it}
              onEdit={() => setEditing(it)}
              onDelete={() => setDeletingId(it.id)}
              metaLines={[
                it.author ? `Autor(a): ${it.author}` : null,
                it.platform ? `Plataforma/Editora: ${it.platform}` : null,
                it.year ? `Ano: ${it.year}` : null,
                it.season ? `Temporada: ${it.season}` : null,
                it.link ? it.link : null
              ].filter(Boolean)}
            />
          ))}
        </div>
      )}

      {/* Modal de edição/criação */}
      {editing && kind !== "course" && (
        <MediaEditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          initial={editing}
          kind={kind}
          onSave={saveItem}
          onDelete={() => setDeletingId(editing.id)}
        />
      )}
      {editing && kind === "course" && (
        <CourseEditModal
          open={!!editing}
          onClose={() => setEditing(null)}
          initial={editing}
          onSave={saveItem}
          onDelete={() => setDeletingId(editing.id)}
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------
   PÁGINA PRINCIPAL
-------------------------------------------*/

export default function LibraryPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <div className="text-sm text-[var(--pc-muted)]">Upload ou URL de imagem, avaliações e notas — tudo salvo localmente.</div>
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books"><BookOpen className="w-4 h-4 mr-2" />Livros</TabsTrigger>
          <TabsTrigger value="films"><Clapperboard className="w-4 h-4 mr-2" />Filmes</TabsTrigger>
          <TabsTrigger value="series"><Tv className="w-4 h-4 mr-2" />Séries</TabsTrigger>
          <TabsTrigger value="courses"><GraduationCap className="w-4 h-4 mr-2" />Cursos</TabsTrigger>
          <TabsTrigger value="readings"><FileText className="w-4 h-4 mr-2" />Leituras</TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <ListSection kind="book" icon={BookOpen} storeKey="lib:books" />
        </TabsContent>

        <TabsContent value="films">
          <ListSection kind="film" icon={Clapperboard} storeKey="lib:films" />
        </TabsContent>

        <TabsContent value="series">
          <ListSection kind="series" icon={Tv} storeKey="lib:series" />
        </TabsContent>

        <TabsContent value="courses">
          <ListSection kind="course" icon={GraduationCap} storeKey="lib:courses" />
        </TabsContent>

        <TabsContent value="readings">
          <ListSection kind="reading" icon={FileText} storeKey="lib:readings" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
