import React, { memo } from 'react';
import { CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose, DrawerTrigger } from "@/components/ui/drawer";

export function ResponsiveClose({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  const isMobile = useIsMobile();
  if (isMobile) return <DrawerClose asChild={asChild}>{children}</DrawerClose>;
  return <DialogClose asChild={asChild}>{children}</DialogClose>;
}

interface ResponsiveModalProps {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ResponsiveModalComponent: React.FC<ResponsiveModalProps> = ({ 
  trigger, 
  title, 
  description, 
  children, 
  open, 
  onOpenChange 
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh] outline-none">
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#E5E8EB] mt-3 mb-1" />
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </DrawerHeader>
          <div className="p-4 pb-8 overflow-y-auto">
            {children}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-xl bg-white border-none shadow-2xl rounded-[24px] p-0 overflow-hidden gap-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[#F2F4F6] flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1 text-left">
            <DialogTitle className="text-xl font-bold text-[#191F28]">{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </div>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-[#F2F4F6] hover:bg-[#E5E8EB]">
              <X className="h-4 w-4 text-[#333D4B]" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ResponsiveModal = memo(ResponsiveModalComponent);
