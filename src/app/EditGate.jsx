'use client'

import { useState } from 'react'
import { Button } from '../../components/button.jsx'
import { Dialog, DialogTitle, DialogBody, DialogActions } from '../../components/dialog.jsx'
import { Input } from '../../components/input.jsx'
import { enableEditMode, disableEditMode } from './actions/auth'

export default function EditGate({ isEditor }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center justify-end">
      {isEditor ? (
        <form action={disableEditMode}>
          <Button type="submit" plain className="text-xs sm:text-sm">Disable edit</Button>
        </form>
      ) : (
        <>
          <Button plain className="text-xs sm:text-sm" onClick={() => setOpen(true)}>Edit</Button>
          <Dialog open={open} onClose={() => setOpen(false)} size="sm">
            <DialogTitle>Enter edit code</DialogTitle>
            <DialogBody>
              <form action={enableEditMode} className="flex items-center gap-2">
                <Input name="code" type="password" placeholder="Edit code" className="max-w-48" required />
                <Button type="submit" color="emerald">Enable</Button>
              </form>
            </DialogBody>
            <DialogActions>
              <Button plain onClick={() => setOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </div>
  )
}


