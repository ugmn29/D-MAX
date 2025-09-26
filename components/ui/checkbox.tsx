"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(props.defaultChecked || false)
    
    // 外部からcheckedプロパティが渡された場合はそれを使用、そうでなければ内部状態を使用
    const isChecked = props.checked !== undefined ? props.checked : internalChecked

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      setInternalChecked(newChecked)
      props.onChange?.(e)
      onCheckedChange?.(newChecked)
    }

    const handleClick = () => {
      const newChecked = !isChecked
      setInternalChecked(newChecked)
      onCheckedChange?.(newChecked)
      // イベントオブジェクトを作成してonChangeも呼び出す
      const syntheticEvent = {
        target: { checked: newChecked },
        currentTarget: { checked: newChecked }
      } as React.ChangeEvent<HTMLInputElement>
      props.onChange?.(syntheticEvent)
    }

    return (
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={isChecked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-slate-900 data-[state=checked]:text-slate-50 cursor-pointer",
            isChecked && "bg-slate-900 border-slate-900 text-white",
            className
          )}
          onClick={handleClick}
        >
          {isChecked && (
            <Check className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }