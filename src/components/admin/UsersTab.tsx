import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
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

type User = {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  chats?: Array<{
    id: string;
    title: string;
    created_at: string;
    message_count?: number;
  }>;
};

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setUsers(data as User[]);
    };

    fetchUsers();

    const channel = supabase
      .channel("admin-users")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setUsers((prev) => [payload.new as User, ...prev]);
          } else if (payload.eventType === "DELETE") {
            setUsers((prev) =>
              prev.filter((user) => user.id !== payload.old.id),
            );
          } else if (payload.eventType === "UPDATE") {
            setUsers((prev) =>
              prev.map((user) =>
                user.id === payload.new.id ? (payload.new as User) : user,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_admin: !currentStatus })
      .eq("id", userId);
  };

  const deleteUser = async (userId: string) => {
    try {
      // First delete all user's chats and messages
      const { data: chats } = await supabase
        .from("chats")
        .select("id")
        .eq("user_id", userId);

      if (chats && chats.length > 0) {
        const chatIds = chats.map((chat) => chat.id);

        // Delete messages for these chats
        await supabase.from("messages").delete().in("chat_id", chatIds);

        // Delete the chats
        await supabase.from("chats").delete().in("id", chatIds);
      }

      // Delete the user profile
      await supabase.from("profiles").delete().eq("id", userId);

      // Delete the user from auth
      await supabase.auth.admin.deleteUser(userId);

      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditName(user.full_name || "");
    setEditEmail(user.email || "");
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    setUpdateError("");

    try {
      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName,
          email: editEmail,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedUser.id);

      if (error) throw error;

      setShowEditDialog(false);
    } catch (error) {
      console.error("Error updating user:", error);
      setUpdateError("Failed to update user");
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const viewUserDetails = async (user: User) => {
    // Fetch user's chats with message count
    const { data: chats } = await supabase
      .from("chats")
      .select(
        `
        id,
        title,
        created_at,
        messages:messages(count)
      `,
      )
      .eq("user_id", user.id);

    if (chats) {
      const formattedChats = chats.map((chat: any) => ({
        ...chat,
        message_count: chat.messages[0].count,
      }));
      setSelectedUser({ ...user, chats: formattedChats });
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant={user.is_admin ? "default" : "outline"}
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => viewUserDetails(user)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Name</h3>
                <p>{selectedUser?.full_name}</p>
              </div>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p>{selectedUser?.email}</p>
              </div>
              <div>
                <h3 className="font-semibold">Created At</h3>
                <p>
                  {selectedUser?.created_at &&
                    new Date(selectedUser.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Role</h3>
                <p>{selectedUser?.is_admin ? "Admin" : "User"}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Chats</h3>
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-2">
                  {selectedUser?.chats?.map((chat) => (
                    <div key={chat.id} className="p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{chat.title}</h4>
                          <p className="text-sm text-gray-500">
                            Created:{" "}
                            {new Date(chat.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-sm bg-gray-100 rounded">
                          {chat.message_count} messages
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            {updateError && (
              <p className="text-sm text-red-500">{updateError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account, all their chats and
              messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => selectedUser && deleteUser(selectedUser.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
