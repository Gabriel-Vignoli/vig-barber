"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2Icon } from "lucide-react"
import { Weekday } from "@prisma/client"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog"
import EmployeeFormDialog from "./employee-form-dialog"
import EmployeeServicesDialog from "./employee-services-dialog"
import EmployeeScheduleDialog from "./employee-schedule-dialog"
import EmployeeStatsDialog from "./employee-stats-dialog"
import { deleteEmployee } from "../_actions/delete-employee"

const getInitials = (name?: string | null) => {
  if (!name) return "?"

  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.charAt(0) ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : ""

  return (first + last).toUpperCase()
}

interface AdminEmployee {
  id: string
  imageUrl: string | null
  user: { name: string | null; email: string | null; image: string | null }
  services: { service: { id: string; name: string } }[]
  schedules: {
    weekday: Weekday
    startTime: string
    endTime: string
    isDayOff: boolean
  }[]
  _count: { bookings: number }
}

interface AdminEmployeesTableProps {
  employees: AdminEmployee[]
  allServices: { id: string; name: string }[]
}

const AdminEmployeesTable = ({
  employees,
  allServices,
}: AdminEmployeesTableProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpenId, setDeleteDialogOpenId] = useState<string | null>(
    null,
  )

  const handleDelete = async (employeeId: string) => {
    setIsDeleting(true)

    try {
      await deleteEmployee(employeeId)
      toast.success("Funcionário removido com sucesso!")
      setDeleteDialogOpenId(null)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao remover funcionário.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <EmployeeFormDialog />
      </div>

      {employees.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">
          Nenhum funcionário cadastrado.
        </p>
      ) : (
        <div className="space-y-3">
          {employees.map((employee) => {
            const employeeName = employee.user.name ?? "Funcionário"
            const employeeImage = employee.imageUrl ?? employee.user.image

            return (
              <Card key={employee.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={employeeImage ?? ""}
                        alt={employeeName}
                        referrerPolicy="no-referrer"
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {getInitials(employeeName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{employeeName}</p>
                      <p className="text-muted-foreground text-xs">
                        {employee.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {employee.services.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        Nenhum serviço
                      </span>
                    ) : (
                      employee.services.map(({ service }) => (
                        <Badge key={service.id} variant="secondary">
                          {service.name}
                        </Badge>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <EmployeeStatsDialog
                      employeeId={employee.id}
                      employeeName={employeeName}
                    />
                    <EmployeeServicesDialog
                      employeeId={employee.id}
                      allServices={allServices}
                      currentServiceIds={employee.services.map(
                        ({ service }) => service.id,
                      )}
                    />
                    <EmployeeScheduleDialog
                      employeeId={employee.id}
                      currentSchedules={employee.schedules}
                    />

                    <AlertDialog
                      open={deleteDialogOpenId === employee.id}
                      onOpenChange={(isOpen) =>
                        setDeleteDialogOpenId(isOpen ? employee.id : null)
                      }
                    >
                      <AlertDialogTrigger
                        render={(triggerProps) => (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive cursor-pointer"
                            {...triggerProps}
                          >
                            <Trash2Icon size={16} />
                          </Button>
                        )}
                      />
                      <AlertDialogContent size="default">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remover funcionário
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover &quot;
                            {employeeName}&quot;? Essa ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeleting}>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.preventDefault()
                              handleDelete(employee.id)
                            }}
                          >
                            {isDeleting ? "Removendo..." : "Confirmar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminEmployeesTable
