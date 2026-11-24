import React, { useState, useEffect } from "react";
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
  Check,
} from "lucide-react";
import { usePublishProject } from "@/api/client/projects";

const FilterDropdown = ({ label, icon: Icon, options = [], selectedValue, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-white border rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
          isOpen
            ? "border-[#0f9f59] ring-2 ring-emerald-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
          <span
            className={`truncate ${
              selectedValue ? "text-slate-800 font-medium" : "text-slate-400"
            }`}
          >
            {selectedValue || label}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-[#0f9f59]" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 max-h-52 overflow-y-auto">
          {options.length > 0 ? (
            options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs transition-colors hover:bg-slate-50 flex items-center justify-between ${
                  selectedValue === option
                    ? "text-[#0f9f59] font-semibold bg-emerald-50/60"
                    : "text-slate-700"
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

const industryOptions = [
  "Climate & Energy",
  "Health & Wellness",
  "Education",
  "Fintech",
  "Agriculture",
  "Creative Technology",
];

const stageOptions = [
  "Idea",
  "Research",
  "Prototype",
  "MVP",
  "Early Revenue",
  "Scaling",
  "Established Business",
];

const emptyForm = {
  title: "",
  description: "",
  industry: "",
  stage: "",
  country: "",
  lookingFor: "",
};

const extractServerError = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.response?.data?.sqlMessage ||
  fallback;

const PublishProjectModal = ({
  isOpen,
  onClose,
  onProjectPublished,
  editingProject = null,
  onSaveDraft,
  onUpdateProject,
}) => {
  const { user } = useSelector((state) => state.user || {});

  const [formData, setFormData] = useState(emptyForm);
  const [validationError, setValidationError] = useState("");

  const { mutateAsync: publishProject, isPending: loading } = usePublishProject();

  useEffect(() => {
    setValidationError("");
    if (editingProject) {
      setFormData({
        title: editingProject.title || "",
        description: editingProject.description || "",
        industry: editingProject.industry || editingProject.category || "",
        stage: editingProject.stage === "Growth" ? "Scaling" : editingProject.stage || "",
        country: editingProject.country || editingProject.location || "",
        lookingFor: editingProject.looking_for || "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const isResubmit =
    editingProject &&
    ["changes_requested", "changes-requested", "rejected"].includes(
      String(editingProject.status || "")
        .toLowerCase()
        .replace(/[\s_]+/g, "-")
    );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValidationError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownSelect = (field, value) => {
    setValidationError("");
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildPayload = (statusValue) => {
    const cleanTitle = formData.title.trim();
    const cleanDescription = formData.description.trim();
    const cleanIndustry = formData.industry.trim();
    const cleanStage = formData.stage.trim();
    const cleanCountry = formData.country.trim();
    const cleanLookingFor = formData.lookingFor.trim();
    const derivedTags = [cleanIndustry, cleanStage].filter(Boolean);

    return {
      ...(editingProject?.id ? { id: editingProject.id } : {}),
      user_id: user.id,
      status: statusValue,
      title: cleanTitle,
      description: cleanDescription || (statusValue === "draft" ? "Draft in progress" : ""),
      category: cleanIndustry || "General",
      industry: cleanIndustry || "General",
      stage: cleanStage || "Idea",
      location: cleanCountry || "Pakistan",
      country: cleanCountry || "Pakistan",
      looking_for: cleanLookingFor || "Feedback",
      match_score: 90,
      tags: derivedTags,
    };
  };

  const handleSaveDraftClick = async () => {
    if (!formData.title.trim()) {
      setValidationError("Please enter at least a project title to save a draft.");
      return;
    }
    if (!user?.id) {
      setValidationError("No logged-in user found — cannot save draft.");
      return;
    }

    const payload = buildPayload("draft");
    try {
      if (editingProject?.id && onUpdateProject) {
        await onUpdateProject(payload);
      } else if (onSaveDraft) {
        await onSaveDraft(payload);
      } else {
        await publishProject(payload);
      }
      setFormData(emptyForm);
      if (onProjectPublished) onProjectPublished();
      onClose();
    } catch (error) {
      setValidationError(
        extractServerError(
          error,
          "Server error (500) while saving draft. Check backend status enum or schema."
        )
      );
      console.error("Error saving draft:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setValidationError("Title and short description are required to submit.");
      return;
    }

    if (!user?.id) {
      setValidationError("No logged-in user found — cannot publish project.");
      return;
    }

    const payload = buildPayload("pending_review");

    try {
      if (editingProject?.id && onUpdateProject) {
        await onUpdateProject(payload);
      } else {
        await publishProject(payload);
      }
      setFormData(emptyForm);
      if (onProjectPublished) onProjectPublished();
      onClose();
    } catch (error) {
      setValidationError(
        extractServerError(
          error,
          "Server error (500) while submitting project. Please try again."
        )
      );
      console.error("Error publishing project:", error);
    }
  };

  const charLimit = 240;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 999999,
      }}
      className="flex items-center justify-center p-4"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[95vh] flex flex-col z-10"
      >
        <div className="px-8 pt-7 pb-5 border-b border-slate-100 bg-gradient-to-br from-emerald-50/70 via-white to-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-6 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-[#0f9f59] flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-[11px] font-bold text-[#0f9f59] uppercase tracking-wider">
              {isResubmit
                ? "Edit & resubmit project"
                : editingProject
                ? "Edit draft"
                : "Publish a project"}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 leading-tight">
            {isResubmit
              ? "Update your project and resubmit."
              : "Give your idea a place to grow."}
          </h3>
          <p className="text-xs text-slate-400 mt-1.5">
            Start with the essentials. You can enrich your project as it evolves.
          </p>
        </div>

        <div className="px-8 py-7 overflow-y-auto flex-1">
          {validationError && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600 font-medium">
              {validationError}
            </div>
          )}

          <form id="publish-project-form" onSubmit={handleSubmit} className="space-y-7">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-[#0f9f59] rounded-full" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Basics
                </span>
              </div>

              <div>
                <FieldLabel required>Project title</FieldLabel>
                <div className="relative">
                  <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. OpenGrid Energy"
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all"
                    required={!editingProject}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel required>Short description</FieldLabel>
                  <span className="text-[10px] text-slate-300 font-medium">
                    {formData.description.length}/{charLimit}
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={charLimit}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What are you building and why does it matter?"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 resize-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-0.5 bg-[#0f9f59] rounded-full" />
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Details
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Industry</FieldLabel>
                  <FilterDropdown
                    label="Select industry"
                    icon={Layers}
                    options={industryOptions}
                    selectedValue={formData.industry}
                    onSelect={(val) => handleDropdownSelect("industry", val)}
                  />
                </div>
                <div>
                  <FieldLabel>Project stage</FieldLabel>
                  <FilterDropdown
                    label="Select stage"
                    icon={Sparkles}
                    options={stageOptions}
                    selectedValue={formData.stage}
                    onSelect={(val) => handleDropdownSelect("stage", val)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <div className="relative">
                    <Globe2 className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Where is this based?"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Looking for</FieldLabel>
                  <div className="relative">
                    <Target className="w-3.5 h-3.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      name="lookingFor"
                      value={formData.lookingFor}
                      onChange={handleChange}
                      placeholder="Design, funding, research"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f9f59] focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="px-8 py-4 flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60">
          <span className="text-[11px] text-slate-400">You can edit these details later.</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            {!isResubmit && (
              <button
                type="button"
                onClick={handleSaveDraftClick}
                disabled={loading}
                className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl cursor-pointer transition-colors disabled:opacity-50"
              >
                Save as draft
              </button>
            )}
            <button
              type="submit"
              form="publish-project-form"
              disabled={loading}
              style={{ backgroundColor: "#0f9f59" }}
              className="text-xs font-semibold text-white px-5 py-2.5 rounded-xl hover:opacity-90 shadow-sm shadow-emerald-200 cursor-pointer transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {loading
                  ? "Submitting..."
                  : isResubmit
                  ? "Resubmit project"
                  : "Publish project"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PublishProjectModal;