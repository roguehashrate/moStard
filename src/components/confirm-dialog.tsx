import { useRef } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";

export type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  colorScheme?: string;
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  colorScheme = "red",
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered motionPreset="scale">
      <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(8px)" />
      <AlertDialogContent borderRadius="3xl">
        <AlertDialogHeader fontSize="lg" fontWeight="bold">{title}</AlertDialogHeader>
        <AlertDialogBody>{description}</AlertDialogBody>
        <AlertDialogFooter gap="2">
          <Button ref={cancelRef} onClick={onClose} variant="ghost">
            {cancelText}
          </Button>
          <Button colorScheme={colorScheme} onClick={onConfirm} borderRadius="full">
            {confirmText}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
