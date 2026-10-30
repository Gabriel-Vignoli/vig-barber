"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { getHasStaffMembership } from "../_actions/get-has-staff-membership"

// Roles are not in the session, so ask the server once the user is signed in
export const useHasStaffMembership = () => {
  const { status } = useSession()
  const [hasStaffMembership, setHasStaffMembership] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return

    let isCancelled = false

    getHasStaffMembership()
      .then((result) => {
        if (!isCancelled) setHasStaffMembership(result)
      })
      .catch(() => {})

    return () => {
      isCancelled = true
    }
  }, [status])

  return status === "authenticated" && hasStaffMembership
}
