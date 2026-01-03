'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContactTable, Contact } from '@/components/contact-table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Plus, Upload, Search, Tag, Trash2, Download, X, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TagItem {
  id: string
  name: string
  color: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [dragActive, setDragActive] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importTagIds, setImportTagIds] = useState<string[]>([])
  
  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [selectedTagId, setSelectedTagId] = useState<string>('')
  const [bulkAction, setBulkAction] = useState<'tag' | 'untag'>('tag')
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
  })

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    fetchContacts()
    fetchTags()
  }, [page, search])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '50',
      })
      if (search) params.append('search', search)

      const response = await fetch(`/api/contacts?${params}`)
      const data = await response.json()

      if (response.ok) {
        setContacts(data.contacts)
        setTotalPages(data.pagination.pages)
        // Clear selection when contacts change
        setSelectedIds([])
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Contact created successfully!')
        setDialogOpen(false)
        setFormData({ email: '', firstName: '', lastName: '' })
        setFormErrors({})
        fetchContacts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create contact')
      }
    } catch (error) {
      toast.error('Failed to create contact')
    }
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a CSV file')
      return
    }

    setImporting(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('file', importFile)
      if (importTagIds.length > 0) {
        formDataObj.append('tagIds', JSON.stringify(importTagIds))
      }
      
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formDataObj,
      })

      const result = await response.json()
      if (response.ok) {
        toast.success(`Import complete: ${result.created} created, ${result.updated} updated`)
        setImportDialogOpen(false)
        setImportFile(null)
        setImportTagIds([])
        fetchContacts()
      } else {
        toast.error(result.error || 'Failed to import contacts')
      }
    } catch (error) {
      toast.error('Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  const toggleImportTag = (tagId: string) => {
    setImportTagIds(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const removeImportTag = (tagId: string) => {
    setImportTagIds(prev => prev.filter(id => id !== tagId))
  }

  const selectedImportTags = tags.filter(tag => importTagIds.includes(tag.id))

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setImportFile(file)
      } else {
        toast.error('Please upload a CSV file')
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0])
    }
  }

  const handleBulkTag = async () => {
    if (!selectedTagId || selectedIds.length === 0) return
    
    setProcessing(true)
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: bulkAction,
          contactIds: selectedIds,
          tagId: selectedTagId,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        toast.success(`${result.processed} contacts ${bulkAction === 'tag' ? 'tagged' : 'untagged'} successfully`)
        setTagDialogOpen(false)
        setSelectedTagId('')
        fetchContacts()
      } else {
        toast.error(result.error || 'Failed to process bulk action')
      }
    } catch (error) {
      toast.error('Failed to process bulk action')
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contacts? This action cannot be undone.`)) return

    setProcessing(true)
    try {
      const response = await fetch('/api/contacts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          contactIds: selectedIds,
        }),
      })

      const result = await response.json()
      if (response.ok) {
        toast.success(`${result.processed} contacts deleted successfully`)
        fetchContacts()
      } else {
        toast.error(result.error || 'Failed to delete contacts')
      }
    } catch (error) {
      toast.error('Failed to delete contacts')
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedIds.length > 0) {
        params.append('contactIds', selectedIds.join(','))
      }
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/contacts/export?${params}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Contacts exported successfully')
      } else {
        toast.error('Failed to export contacts')
      }
    } catch (error) {
      toast.error('Failed to export contacts')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Contacts</h1>
          <p className="text-slate-400 mt-2">Manage your email contacts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={(open) => {
            setImportDialogOpen(open)
            if (!open) {
              setImportFile(null)
              setImportTagIds([])
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Contacts</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with columns: email, firstName, lastName
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-amber-400 bg-amber-400/10'
                      : importFile
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="csv-upload"
                    accept=".csv"
                    onChange={handleFileSelect}
                    disabled={importing}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {importFile ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="mx-auto h-10 w-10 text-green-500" />
                      <p className="text-sm text-slate-100 font-medium">{importFile.name}</p>
                      <p className="text-xs text-slate-400">
                        {(importFile.size / 1024).toFixed(1)} KB
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setImportFile(null)
                        }}
                        className="text-slate-400 hover:text-slate-100"
                      >
                        <X className="mr-1 h-3 w-3" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className={`mx-auto h-10 w-10 ${dragActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <p className="text-sm text-slate-300">
                        <span className="font-medium text-amber-400">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-500">CSV files only</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Assign to Groups (Optional)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between bg-slate-900 border-slate-700 hover:bg-slate-800"
                      >
                        {importTagIds.length === 0
                          ? 'Select groups...'
                          : `${importTagIds.length} group${importTagIds.length > 1 ? 's' : ''} selected`}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      {tags.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-slate-400">
                          No groups available
                        </div>
                      ) : (
                        tags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag.id}
                            checked={importTagIds.includes(tag.id)}
                            onCheckedChange={() => toggleImportTag(tag.id)}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </div>
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {selectedImportTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedImportTags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="pl-2 pr-1 py-1"
                          style={{ borderColor: tag.color, borderWidth: 1 }}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => removeImportTag(tag.id)}
                            className="ml-1 hover:bg-slate-600 rounded p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Imported contacts will be added to selected groups
                  </p>
                </div>
                <Button 
                  onClick={handleImport} 
                  disabled={importing || !importFile}
                  className="w-full"
                >
                  {importing ? 'Importing...' : 'Import Contacts'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Contact</DialogTitle>
                <DialogDescription>
                  Create a new contact in your database
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (formErrors.email) setFormErrors({ ...formErrors, email: '' })
                    }}
                    required
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create Contact
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10 bg-slate-900 border-slate-800"
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <span className="text-sm text-slate-300 font-medium">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-slate-600" />
          
          <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setBulkAction('tag')}>
                <Tag className="mr-2 h-4 w-4" />
                Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{bulkAction === 'tag' ? 'Add Tag' : 'Remove Tag'}</DialogTitle>
                <DialogDescription>
                  {bulkAction === 'tag' 
                    ? `Add a tag to ${selectedIds.length} selected contacts`
                    : `Remove a tag from ${selectedIds.length} selected contacts`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Tag</Label>
                  <Select value={selectedTagId} onValueChange={setSelectedTagId}>
                    <SelectTrigger className="bg-slate-900 border-slate-700">
                      <SelectValue placeholder="Choose a tag..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkTag} 
                    disabled={!selectedTagId || processing}
                    className="flex-1"
                  >
                    {processing ? 'Processing...' : bulkAction === 'tag' ? 'Add Tag' : 'Remove Tag'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setBulkAction('untag')
              setTagDialogOpen(true)
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Remove Tag
          </Button>

          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleBulkDelete}
            disabled={processing}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>

          <div className="ml-auto">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-md border border-slate-800">
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px] ml-auto" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <ContactTable 
            contacts={contacts} 
            onDelete={fetchContacts}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
