import React, { useState } from 'react';
import OverviewPublishModal from './OverviewPublishModal';

const TestModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-md text-center max-w-md w-full">
        <h1 className="text-xl font-bold text-slate-800 mb-2">
          Modal Direct Test Page
        </h1>
        <p className="text-xs text-slate-500 mb-6">
          Yeh page bina kisi Layout/Sidebar ke direct modal test karega.
        </p>

        <button
          type="button"
          onClick={() => {
            console.log("Test Button Clicked!");
            setIsModalOpen(true);
          }}
          style={{ backgroundColor: '#0f9f59' }}
          className="w-full text-white font-semibold py-3 px-6 rounded-xl hover:opacity-90 shadow-lg cursor-pointer"
        >
          Open Modal Test
        </button>
      </div>

      {/* Modal Component */}
      <OverviewPublishModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default TestModal;