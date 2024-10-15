"use client";

import { useContext } from "react";
import {Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure} from "@nextui-org/react";


import { ModalContext } from "@/app/providers";

export default function Modals() {
  const modalContext = useContext(ModalContext);

  console.log('[[[modalContext]]]',modalContext);
  return (
    <div>
      <Modal isOpen={modalContext?.openModals.includes("alertModal")} onOpenChange={() => modalContext?.setOpenModals((prev: any) => prev.filter((modal: any) => modal !== "alertModal"))}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 inter">Alerts</ModalHeader>
              <ModalBody>
                <p className="inter"> 
                  You will be able to set alerts in the single chart view.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button  className="inter" color="primary" onPress={onClose}>
                  Got it!
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
