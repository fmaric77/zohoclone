'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Mail, Trash2 } from 'lucide-react'

export interface Contact {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: 'SUBSCRIBED' | 'UNSUBSCRIBED' | 'BOUNCED'
  tags: Array<{ tag: { id: string; name: string; color: string } }>
}

interface ContactTableProps {
  contacts: Contact[]
  onDelete?: (id: string) => void
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}

export function ContactTable({ 
  contacts, 
  onDelete, 
  selectedIds = [], 
  onSelectionChange 
}: ContactTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete contact')
      }

      onDelete?.(id)
    } catch (error) {
      console.error('Failed to delete contact:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange(contacts.map((c) => c.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (contactId: string, checked: boolean) => {
    if (!onSelectionChange) return
    if (checked) {
      onSelectionChange([...selectedIds, contactId])
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== contactId))
    }
  }

  const allSelected = contacts.length > 0 && selectedIds.length === contacts.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < contacts.length

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      SUBSCRIBED: 'default',
      UNSUBSCRIBED: 'secondary',
      BOUNCED: 'destructive',
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {status}
      </Badge>
    )
  }

  const showCheckboxes = onSelectionChange !== undefined

  return (
    <div className="rounded-md border border-slate-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-900">
            {showCheckboxes && (
              <TableHead className="w-[50px]">
                <Input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) {
                      (el as HTMLInputElement).indeterminate = someSelected
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
            )}
            <TableHead>Email</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? 6 : 5} className="text-center text-slate-400 py-8">
                No contacts found
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <TableRow 
                key={contact.id} 
                className={`border-slate-800 ${selectedIds.includes(contact.id) ? 'bg-slate-800/50' : ''}`}
              >
                {showCheckboxes && (
                  <TableCell>
                    <Input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedIds.includes(contact.id)}
                      onChange={(e) => handleSelectOne(contact.id, e.target.checked)}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    {contact.email}
                  </Link>
                </TableCell>
                <TableCell>
                  {contact.firstName || contact.lastName
                    ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim()
                    : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(contact.status)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map(({ tag }) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        style={{ borderColor: tag.color }}
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deleting === contact.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/contacts/${contact.id}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(contact.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
