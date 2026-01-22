import React from 'react';
import { Mail, Phone, Building2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const statusColors = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
  lead: "bg-blue-100 text-blue-700",
};

export default function ClientCard({ client, projectCount = 0, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/60 hover:border-slate-300/80 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-lg"
            style={{ backgroundColor: client.avatar_color || '#10b981' }}
          >
            {(client.first_name?.charAt(0) || client.last_name?.charAt(0) || 'C').toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {[client.first_name, client.last_name].filter(Boolean).join(' ') || 'Unnamed Client'}
            </h3>
            {client.company && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {client.company}
              </p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(client)} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-2 text-sm">
        <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors">
          <Mail className="w-4 h-4 text-slate-400" />
          {client.email}
        </a>
        {client.phone && (
          <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 transition-colors">
            <Phone className="w-4 h-4 text-slate-400" />
            {client.phone}
          </a>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <Badge className={cn("font-medium", statusColors[client.status])}>
          {client.status?.charAt(0).toUpperCase() + client.status?.slice(1)}
        </Badge>
        <span className="text-sm text-slate-500">{projectCount} projects</span>
      </div>
    </div>
  );
}