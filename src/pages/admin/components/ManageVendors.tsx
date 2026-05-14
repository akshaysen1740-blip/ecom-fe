import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable, ColumnDef } from "@/components/ui/data-table";

export interface Vendor {
  id: string;
  name: string;
}

// We just need products to count the mapped products.
// We can pass a prop `getVendorProductCount: (vendorId: string) => number` instead to decouple.
interface ManageVendorsProps {
  vendors: Vendor[];
  onVendorCreated: () => void;
  getVendorProductCount: (vendorId: string) => number;
}

export function ManageVendors({
  vendors,
  onVendorCreated,
  getVendorProductCount,
}: ManageVendorsProps) {
  const [newVendorName, setNewVendorName] = useState("");
  const [isCreatingVendor, setIsCreatingVendor] = useState(false);

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) {
      toast.error("Please enter a vendor name");
      return;
    }

    setIsCreatingVendor(true);
    try {
      await api.vendors.create(newVendorName.trim());
      setNewVendorName("");
      toast.success("Vendor created successfully!");
      onVendorCreated();
    } catch (error: any) {
      toast.error(error.message || "Failed to create vendor");
    } finally {
      setIsCreatingVendor(false);
    }
  };

  const columns: ColumnDef<Vendor>[] = [
    {
      header: "Vendor Name",
      accessorKey: "name",
      className: "font-medium",
    },
    {
      header: "Products Count",
      cell: ({ row }) => getVendorProductCount(row.id),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold">Manage Vendors</h3>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="New vendor name"
            value={newVendorName}
            onChange={(event) => setNewVendorName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleCreateVendor();
              }
            }}
            className="sm:w-56"
          />
          <Button
            onClick={handleCreateVendor}
            disabled={isCreatingVendor || !newVendorName.trim()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={vendors}
        searchKey="name"
        searchPlaceholder="Search vendors..."
        emptyMessage="No vendors yet. Create one to get started."
      />
    </div>
  );
}
