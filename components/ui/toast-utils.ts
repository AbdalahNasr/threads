"use client";

// Simple toast function that uses DOM directly
// This avoids all the complex type issues with React components

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Create a toast that doesn't rely on complex component types
export const toast = (options: ToastOptions) => {
  const { title, description, variant = 'default', duration = 3000 } = options;
  
  // Make sure we're on the client side
  if (typeof document === 'undefined') return { dismiss: () => {} };
  
  // Create or get toast container
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastElement = document.createElement('div');
  toastElement.className = `toast toast-${variant}`;
  toastElement.style.padding = '1rem';
  toastElement.style.marginTop = '0.5rem';
  toastElement.style.borderRadius = '0.5rem';
  toastElement.style.width = '300px';
  toastElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  
  // Set color based on variant
  if (variant === 'destructive') {
    toastElement.style.backgroundColor = '#ef4444';
    toastElement.style.color = 'white';
  } else {
    toastElement.style.backgroundColor = 'white';
    toastElement.style.color = 'black';
    toastElement.style.border = '1px solid #e5e7eb';
  }
  
  // Add title if provided
  if (title) {
    const titleElement = document.createElement('div');
    titleElement.textContent = title;
    titleElement.style.fontWeight = 'bold';
    titleElement.style.marginBottom = '0.25rem';
    toastElement.appendChild(titleElement);
  }
  
  // Add description if provided
  if (description) {
    const descElement = document.createElement('div');
    descElement.textContent = description;
    descElement.style.fontSize = '0.875rem';
    toastElement.appendChild(descElement);
  }
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '0.5rem';
  closeButton.style.right = '0.5rem';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '1.25rem';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => {
    toastContainer?.removeChild(toastElement);
  };
  toastElement.appendChild(closeButton);
  
  // Append toast to container
  toastContainer.appendChild(toastElement);
  
  // Remove after duration
  setTimeout(() => {
    if (toastContainer?.contains(toastElement)) {
      toastContainer.removeChild(toastElement);
    }
  }, duration);
  
  // For chaining
  return {
    dismiss: () => {
      if (toastContainer?.contains(toastElement)) {
        toastContainer.removeChild(toastElement);
      }
    }
  };
};

// Create a style tag for toast animations - only do this once
if (typeof document !== 'undefined') {
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      .toast {
        position: relative;
        animation: slideIn 0.3s ease-out;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .toast-destructive {
        background-color: #ef4444;
        color: white;
      }
    `;
    document.head.appendChild(style);
  }
}

// React hook for toast
export function useToast() {
  return { toast };
}