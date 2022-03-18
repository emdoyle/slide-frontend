import { Slide } from "@slidexyz/slide-sdk";
import { Program } from "@project-serum/anchor";
import { createContext, useContext } from "react";

export interface SlideProgramState {
  program: Program<Slide> | undefined;
}

export const SlideProgramContext = createContext<SlideProgramState>(
  {} as SlideProgramState
);

export function useSlideProgram(): SlideProgramState {
  return useContext(SlideProgramContext);
}
