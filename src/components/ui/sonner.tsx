"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      expand={true}
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        duration: 4000,
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border group-[.toaster]:border-gray-200 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:gap-3",
          description: "group-[.toast]:text-gray-600 group-[.toast]:text-sm",
          actionButton: "group-[.toast]:bg-purple-600 group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:font-semibold",
          cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-xl",
          closeButton: "!absolute !right-2 !top-1/2 !-translate-y-1/2 !bg-transparent hover:!bg-gray-100 !border-0 !text-gray-400 hover:!text-gray-600 !w-6 !h-6 !rounded-lg !transition-colors",
          success: "group-[.toast]:!border-emerald-300 group-[.toast]:!bg-emerald-50",
          error: "group-[.toast]:!border-red-300 group-[.toast]:!bg-red-50",
          warning: "group-[.toast]:!border-amber-300 group-[.toast]:!bg-amber-50",
          info: "group-[.toast]:!border-blue-300 group-[.toast]:!bg-blue-50",
          title: "group-[.toast]:font-semibold group-[.toast]:text-base",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
