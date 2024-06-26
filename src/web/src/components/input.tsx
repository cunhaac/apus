interface InputProps {
  handleChange: (e: any) => void;
  handleOnFocus?: () => void;
  value?: string | number;
  labelText: string;
  labelFor: string;
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  placeholder: string;
  step?: string | undefined;
  pattern?: string | undefined;
  customClass?: string;
}

const fixedInputClass =
  "bg-transparent rounded-md appearance-none relative block w-full px-3 py-2 border border-white-300 placeholder-gray-500 text-white focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm focus:ring-0";

export function Input({
  handleChange,
  handleOnFocus,
  value,
  labelText,
  labelFor,
  id,
  name,
  type,
  isRequired = false,
  placeholder,
  customClass,
  step = undefined,
  pattern = undefined,
}: InputProps) {
  return (
    <div className="my-5">
      <label htmlFor={labelFor} className="sr-only">
        {labelText}
      </label>
      <input
        onChange={handleChange}
        value={value}
        id={id}
        name={name}
        type={type}
        required={isRequired}
        className={fixedInputClass + customClass}
        placeholder={placeholder}
        onFocus={handleOnFocus}
        pattern={pattern}
        step={step}
      />
    </div>
  );
}
