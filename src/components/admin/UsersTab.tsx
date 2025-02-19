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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";

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
    await supabase.from("profiles").delete().eq("id", userId);
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
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => deleteUser(user.id)}
                  >
                    Delete
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
    </>
  );
}
