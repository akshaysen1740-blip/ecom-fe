import { cn } from "@/lib/utils";

interface ColorSelectorProps {
  colors: Array<{
    name: string;
    value: string;
    image_url: string;
  }>;
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorSelector = ({ colors, selectedColor, onColorSelect }: ColorSelectorProps) => {
  return (
    <div className="flex gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onColorSelect(color.name)}
          className={cn(
            "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
            selectedColor === color.name
              ? "border-primary shadow-md scale-110"
              : "border-border hover:border-primary/50"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
          aria-label={`Select ${color.name} color`}
        />
      ))}
    </div>
  );
};