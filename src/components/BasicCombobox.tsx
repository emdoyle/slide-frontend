import { Fragment, useState } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";

export type BasicComboboxProps<T> = {
  value: T | null;
  setValue: (value: T | null) => void;
  options: T[];
  label: string;
  disabled: boolean;
  getDisplayable: (
    value: T | null,
    selected?: boolean,
    active?: boolean
  ) => string;
  getFilterable?: (value: T) => string;
  getKey?: (value: T) => string;
  maxOptions?: number;
};

export function BasicCombobox<T>({
  value,
  setValue,
  options,
  label,
  disabled,
  getDisplayable,
  getFilterable,
  getKey,
  maxOptions = 4,
}: BasicComboboxProps<T>) {
  const [query, setQuery] = useState<string>("");

  const keyFn = getKey ?? getDisplayable;
  const filterFn = getFilterable ?? getDisplayable;
  const filteredOptions =
    query === ""
      ? options.slice(0, maxOptions)
      : options
          .filter((option) =>
            filterFn(option)
              .toLowerCase()
              .replace(/\s+/g, "")
              .includes(query.toLowerCase().replace(/\s+/g, ""))
          )
          .slice(0, maxOptions);

  return (
    <div className="w-full">
      <Combobox value={value} onChange={setValue} disabled={disabled}>
        <div className="relative mt-1">
          <div
            className={`relative w-full text-left ${
              disabled ? "bg-gray-600" : "bg-white"
            } rounded-lg shadow-md cursor-default focus:outline-none focus-visible:ring-2 focus-visible:ring-opacity-75 focus-visible:ring-white focus-visible:ring-offset-teal-300 focus-visible:ring-offset-2 sm:text-sm overflow-hidden`}
          >
            <Combobox.Label className="absolute text-gray-600 pl-2 pt-2">
              {label}
            </Combobox.Label>
            <Combobox.Input
              className="w-full border-none focus:ring-0 py-8 pb-2 pl-3 pr-10 text-sm leading-5 text-gray-900"
              displayValue={getDisplayable}
              onChange={(event) => setQuery(event.target.value)}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <SelectorIcon
                className={`w-5 h-5 ${
                  disabled ? "text-black cursor-not-allowed" : "text-gray-400"
                }`}
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="w-full py-1 mt-1 text-base bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.length === 0 ? (
                <div className="cursor-default select-none relative py-2 px-4 text-gray-700">
                  {options.length === 0
                    ? "No options available."
                    : "Nothing found."}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={keyFn(option)}
                    className={({ active }) =>
                      `cursor-default select-none relative py-2 pl-10 pr-4 ${
                        active ? "text-white bg-blue-600" : "text-gray-900"
                      }`
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {getDisplayable(option)}
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? "text-white" : "text-teal-600"
                            }`}
                          >
                            <CheckIcon className="w-5 h-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}
