import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

import Input from '/src/components/shared/Input.jsx';
import TextArea from '/src/components/shared/TextArea.jsx';
import Select from '/src/components/shared/Select.jsx';

export default function PublishProjectModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    stage: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // 🔒 Lock background page scroll while modal is open
  // This is what was causing the modal to scroll off-screen and
  // cut off its rounded corners — the page behind it was scrolling.
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Published Project Data:", formData);
    onClose();
  };

  const modalUI = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {/* Dark Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 1000000,
          maxHeight: '85vh',
        }}
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-gray-100 bg-white shrink-0">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Publish a project</h2>
          <button
            onClick={onClose}
            type="button"
            className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 bg-gradient-to-b from-gray-50/60 to-white">

          {/* Inner Bordered Card */}
          <div className="border border-gray-100 rounded-2xl p-6 sm:p-8 bg-white relative space-y-7 shadow-sm">

            {/* Top Close Icon */}
            <button
              onClick={onClose}
              type="button"
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title Section */}
            <div className="pr-8 space-y-1.5">
              <span className="text-[11px] font-extrabold text-[#00a664] tracking-widest uppercase block">
                Publish a project
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
                Give your idea a place to grow.
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Start with the essentials. You can enrich your project as it evolves.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Project title"
                name="title"
                placeholder="e.g. OpenGrid Energy"
                value={formData.title}
                onChange={handleChange}
              />

              <TextArea
                label="Short description"
                name="description"
                placeholder="What are you building and why does it matter?"
                rows={3}
                value={formData.description}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Industry"
                  name="industry"
                  placeholder="Select industry"
                  options={['CleanTech', 'FinTech', 'HealthTech', 'Education', 'AI & Data']}
                  value={formData.industry}
                  onChange={handleChange}
                />

                <Select
                  label="Project stage"
                  name="stage"
                  placeholder="Select stage"
                  options={['Idea', 'Prototype', 'MVP', 'Early Traction', 'Scaling']}
                  value={formData.stage}
                  onChange={handleChange}
                />
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-end border-t border-gray-100 mt-2 pt-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-5 py-2.5 rounded-xl transition-colors cursor-pointer mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#00a664' }}
                  className="hover:opacity-90 text-white font-semibold px-6 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 text-xs cursor-pointer"
                >
                  Publish project
                </button>
              </div>
            </form>

          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}
