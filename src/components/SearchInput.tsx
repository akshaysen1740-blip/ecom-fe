import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchInput = ({ onSearch, placeholder = "Search products..." }: SearchInputProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
  };

  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-10 pr-10 h-10 md:h-9 text-base md:text-sm"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearSearch}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 md:h-6 md:w-6 p-0 touch-manipulation"
        >
          <X className="h-4 w-4 md:h-3 md:w-3" />
        </Button>
      )}
    </div>
  );
};