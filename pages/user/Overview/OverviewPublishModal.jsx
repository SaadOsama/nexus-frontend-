import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { 
  X, 
  Sparkles, 
  FileText, 
  Layers, 
  Globe2, 
  Target, 
  Loader2, 
  ChevronDown, 
  Check 
} from "lucide-react";
import { usePublishProject } from "@/api/client/projects";

// ==========================================
// 1. FILTER DROPDOWN COMPONENT
// ==========================================
const FilterDropdown = ({ label, icon: Icon, options = [], selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
          isOpen ? 'border-[#0f9f59] ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span className={`truncate ${selectedValue ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
            {selectedValue || label}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#0f9f59]' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => { onSelect(option); setIsOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 flex items-center justify-between ${
                  selectedValue === option ? 'text-[#0f9f59] font-semibold bg-emerald-50/60' : 'text-slate-700'
                }`}
              >
                {option}
                {selectedValue === option && <Check className="w-3.5 h-3.5" />}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-slate-400">No options</div>
          )}
        </div>
      )}
    </div>
  );
};

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-bold text-slate-700 mb-2">
    {children}
    {required && <span className="text-[#0f9f59] ml-0.5">*</span>}
  </label>
);

const industryOptions = ['Climate & Energy', 'Health & Wellness', 'Education', 'Fintech', 'Agriculture', 'Creative Technology'];
const stageOptions = ['Idea', 'Prototype', 'MVP', 'Early Revenue', 'Growth'];

const PublishProjectModal = ({ isOpen, onClose, onProjectPublished }) => {
  // 🟢 Redux se logged-in user get karein (ya user ID 1 as fallback)
const { user } = useSelector((state) => state.user || {});

  const [formData, setFormData] = useState({
    title: '', description: '', industry: '', stage: '', country: '', lookingFor: '',
  });

  const { mutateAsync: publishProject, isPending: loading } = usePublishProject();

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownSelect = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    // 🟢 Fix: Express backend ke required validation fields (user_id included)
    const payload = {
      user_id: user?.id || user?._id || 1, 
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.industry || 'General',
      industry: formData.industry || 'General',
      stage: formData.stage || 'Idea',
      location: formData.country || 'Pakistan',
      looking_for: formData.lookingFor || 'Feedback',
      match_score: 90,
      tags: [formData.industry, formData.stage].filter(Boolean),
    };

    try {
      await publishProject(payload);
      setFormData({ title: '', description: '', industry: '', stage: '', country: '', lookingFor: '' });
      if (onProjectPublished) onProjectPublished();
      onClose();
    } catch (error) {
      console.error("Error publishing project:", error);
    }
  };

  const charLimit = 240;

  return createPortal(
    <div
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(6px)', zIndex: 999999 }}
      className="flex items-center justify-center p-4"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div onClick={(e) => e.stopPropagation()} className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] flex flex-col z-10">
        <div className="px-8 pt-7 pb-5 border-b border-slate-100 bg-gradient-to-br from-emerald-50/70 via-white to-white relative">
          <button type="button" onClick={onClose} className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#0f9f59] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">Publish a project</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 leading-tight">Give your idea a place to grow.</h3>
          <p className="text-xs text-slate-400 mt-1.5">Start with the essentials. You can enrich your project as it evolves.</p>
        </div>

        <div className="px-8 py-7 overflow-y-auto flex-1">
          <form id="publish-project-form" onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-[#0f9f59] rounded-full" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Basics</span>
              </div>

              <div>
                <FieldLabel required>Project title</FieldLabel>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" name="title" value={formData.title} onChange={handleChange}
                    placeholder="e.g. OpenGrid Energy"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel required>Short description</FieldLabel>
                  <span className="text-[10px] text-slate-300 font-medium">{formData.description.length}/{charLimit}</span>
                </div>
                <textarea
                  rows={3} maxLength={charLimit} name="description" value={formData.description} onChange={handleChange}
                  placeholder="What are you building and why does it matter?"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-[#0f9f59] rounded-full" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Details</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Industry</FieldLabel>
                  <FilterDropdown label="Select industry" icon={Layers} options={industryOptions} selectedValue={formData.industry} onSelect={(val) => handleDropdownSelect('industry', val)} />
                </div>
                <div>
                  <FieldLabel>Project stage</FieldLabel>
                  <FilterDropdown label="Select stage" icon={Sparkles} options={stageOptions} selectedValue={formData.stage} onSelect={(val) => handleDropdownSelect('stage', val)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <div className="relative">
                    <Globe2 className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Where is this based?" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Looking for</FieldLabel>
                  <div className="relative">
                    <Target className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input type="text" name="lookingFor" value={formData.lookingFor} onChange={handleChange} placeholder="Design, funding, research" className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-4 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
          <span className="text-[11px] text-slate-400">You can edit these details later.</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" form="publish-project-form" disabled={loading} style={{ backgroundColor: '#0f9f59' }} className="text-xs font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-90 shadow-sm shadow-emerald-200 cursor-pointer transition-opacity flex items-center gap-2 disabled:opacity-50">
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Publishing...' : 'Publish project'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PublishProjectModal;