'use client'

import React from 'react'
import { Modal } from './modal'
import { Button } from './button'

interface AlertDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  buttonText?: string
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'OK'
}: AlertDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
