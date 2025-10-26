'use client'

import { TaskStatus, useChecklistStore } from '@/store/checklistStore'
import { Button, Space, Segmented, message } from 'antd'
import {
  FilePdfOutlined,
  LinkOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import { jsPDF } from 'jspdf'

export default function ChecklistToolbar() {
  const { filter, setFilter, tasks, getFilteredTasks } = useChecklistStore()

  const handleFilterChange = (value: string | number) => {
    setFilter(value as TaskStatus | 'all')
  }

  const handleExportPDF = async () => {
    const messageKey = 'export-pdf'
    message.loading({ content: 'Generating PDF...', key: messageKey })

    try {
      // Create PDF content
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15

      // Add header
      pdf.setFontSize(20)
      pdf.setTextColor(24, 144, 255)
      pdf.text('ChatTax - Tax Preparation Checklist', margin, margin + 5)

      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      pdf.text(
        `Generated on ${new Date().toLocaleDateString()}`,
        margin,
        margin + 12
      )

      // Add line
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, margin + 15, pageWidth - margin, margin + 15)

      let yPosition = margin + 25

      // Add tasks
      const filteredTasks = getFilteredTasks()
      pdf.setFontSize(12)
      pdf.setTextColor(0, 0, 0)

      filteredTasks.forEach((task) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          pdf.addPage()
          yPosition = margin + 10
        }

        // Status badge
        const statusColors: Record<TaskStatus, [number, number, number]> = {
          todo: [150, 150, 150],
          doing: [255, 165, 0],
          done: [82, 196, 26],
        }
        const [r, g, b] = statusColors[task.status]
        pdf.setFillColor(r, g, b)
        pdf.circle(margin + 2, yPosition - 1, 1.5, 'F')

        // Checkbox
        pdf.setDrawColor(200, 200, 200)
        pdf.rect(margin + 6, yPosition - 3, 4, 4)
        if (task.status === 'done') {
          pdf.setDrawColor(82, 196, 26)
          pdf.setLineWidth(0.5)
          pdf.line(margin + 7, yPosition - 1, margin + 8, yPosition + 1)
          pdf.line(margin + 8, yPosition + 1, margin + 10, yPosition - 2)
          pdf.setLineWidth(0.2)
        }

        // Title
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        if (task.status === 'done') {
          pdf.setTextColor(150, 150, 150)
        } else {
          pdf.setTextColor(0, 0, 0)
        }
        pdf.text(task.title, margin + 12, yPosition)

        // Status and Priority
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.setTextColor(100, 100, 100)
        const statusText = `[${task.status.toUpperCase()}]`
        const priorityText = task.priority
          ? ` • ${task.priority.toUpperCase()} Priority`
          : ''
        pdf.text(statusText + priorityText, margin + 12, yPosition + 4)

        // Description
        pdf.setFontSize(10)
        pdf.setTextColor(80, 80, 80)
        const descLines = pdf.splitTextToSize(
          task.description,
          pageWidth - margin * 2 - 12
        )
        pdf.text(descLines, margin + 12, yPosition + 9)

        yPosition += 9 + descLines.length * 4 + 8
      })

      // Add footer
      const totalPages = pdf.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, {
          align: 'center',
        })
        pdf.text('ChatTax - AI Tax Assistant', margin, pageHeight - 10)
      }

      // Save PDF
      pdf.save(`tax-checklist-${new Date().toISOString().split('T')[0]}.pdf`)

      message.success({
        content: 'PDF exported successfully!',
        key: messageKey,
        duration: 2,
      })
    } catch (error) {
      console.error('PDF export error:', error)
      message.error({
        content: 'Failed to export PDF',
        key: messageKey,
        duration: 2,
      })
    }
  }

  const handleShareLink = () => {
    const filteredTasks = getFilteredTasks()
    const taskData = filteredTasks.map((task) => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
    }))

    // Create shareable link with encoded data
    const baseUrl = window.location.origin + window.location.pathname
    const encodedData = btoa(JSON.stringify(taskData))
    const shareUrl = `${baseUrl}?shared=${encodedData}`

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        message.success('Share link copied to clipboard!')
      })
      .catch((error) => {
        console.error('Clipboard error:', error)
        message.error('Failed to copy link')
      })
  }

  const todoCount = tasks.filter((t) => t.status === 'todo').length
  const doingCount = tasks.filter((t) => t.status === 'doing').length
  const doneCount = tasks.filter((t) => t.status === 'done').length

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <FilterOutlined className="text-gray-500" />
        <Segmented
          value={filter}
          onChange={handleFilterChange}
          options={[
            { label: `All (${tasks.length})`, value: 'all' },
            { label: `Todo (${todoCount})`, value: 'todo' },
            { label: `Doing (${doingCount})`, value: 'doing' },
            { label: `Done (${doneCount})`, value: 'done' },
          ]}
        />
      </div>

      {/* Actions */}
      <Space>
        <Button
          type="default"
          icon={<LinkOutlined />}
          onClick={handleShareLink}
        >
          Share Link
        </Button>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleExportPDF}
        >
          Export PDF
        </Button>
      </Space>
    </div>
  )
}
