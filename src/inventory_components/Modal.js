import React, { useEffect, useRef } from 'react';

const Modal = ({ id, title, content, footer, closeModal }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [closeModal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        id={id}
        ref={modalRef}
        className="bg-white rounded-lg max-w-md w-full max-h-full overflow-auto shadow-xl transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900" id={`${id}-title`}>
            {title}
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={closeModal}
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {content}
        </div>
        {footer && (
          <div className="px-4 py-3 bg-gray-50 flex flex-row-reverse gap-3 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;