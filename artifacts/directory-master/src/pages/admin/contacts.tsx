import { useListContacts, useDeleteContact } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminContactsPage() {
  const { data, isLoading } = useListContacts();
  const queryClient = useQueryClient();
  const deleteContact = useDeleteContact();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const contacts = data?.contacts ?? [];

  const handleConfirmDelete = async () => {
    if (pendingDeleteId === null) return;
    setDeletingId(pendingDeleteId);
    setPendingDeleteId(null);
    try {
      await deleteContact.mutateAsync({ id: pendingDeleteId });
      await queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => { if (!open) setPendingDeleteId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This contact submission will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Claim Your Listing form submissions
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <Users className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {contacts.length} {contacts.length === 1 ? "submission" : "submissions"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-lg">No submissions yet</p>
              <p className="text-muted-foreground text-sm mt-1">
                When visitors fill out the Claim Your Listing form, they'll appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Full Name</th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone</span>
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</span>
                  </th>
                  <th className="text-left px-5 py-3 font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Submitted</span>
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {contacts.map((c, i) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{i + 1}</td>
                    <td className="px-5 py-3.5 font-medium">{c.fullName}</td>
                    <td className="px-5 py-3.5">
                      <a href={`tel:${c.phone}`} className="text-primary hover:underline">
                        {c.phone}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <a href={`mailto:${c.email}`} className="text-primary hover:underline">
                        {c.email}
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(c.id)}
                        disabled={deletingId === c.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Delete contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
