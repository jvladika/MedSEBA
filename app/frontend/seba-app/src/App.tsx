import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import { style } from "../src/styles";
import { Header } from "./ui/components";
import { ResultPage, Landing } from "./ui/pages";
import { fontSizes } from "./styles/sizes";
import { BaseNavigator } from "./navigation/BaseNavigator";
import { AuthProvider } from "./context/AuthContext";
import { SnackbarProvider } from "notistack";
import { SidebarProvider } from "./context/SidebarContext";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

function App() {
  //Defines global styles using CSS variables, including fonts and colors from the style object.
  const appStyles = {
    "--font-roboto": style.font.roboto.family,
    "--font-roboto-weight-thin": style.font.roboto.weight.thin,
    "--font-roboto-weight-light": style.font.roboto.weight.light,
    "--font-roboto-weight-regular": style.font.roboto.weight.regular,
    "--font-roboto-weight-medium": style.font.roboto.weight.medium,
    "--font-roboto-weight-bold": style.font.roboto.weight.bold,
    "--font-roboto-weight-black": style.font.roboto.weight.black,
    "--font-outfit": style.font.outfit.family,
    "--font-outfit-weight-thin": style.font.outfit.weight.thin,
    "--font-outfit-weight-light": style.font.outfit.weight.light,
    "--font-outfit-weight-regular": style.font.outfit.weight.regular,
    "--font-outfit-weight-medium": style.font.outfit.weight.medium,
    "--font-outfit-weight-bold": style.font.outfit.weight.bold,
    "--font-outfit-weight-black": style.font.outfit.weight.black,
    "--color-main-color": style.colors.mainColor,
    "--color-black": style.colors.black,
    "--color-white": style.colors.white,
    "--color-gray": style.colors.gray,
    "--color-light-black": style.colors.lightBlack,
    "--color-light-gray": style.colors.lightGray,
    "--color-white-gray": style.colors.whiteGray,
    "--color-white-main-color-hover": style.colors.mainColorHover,
    "--color-light-orange": style.colors.lightOrange,
    "--color-red": style.colors.red,
    "--color-yellow": style.colors.yellow,
    "--color-green": style.colors.green,
    "--font-sizes-x-small": fontSizes.xSmall,
    "--font-sizes-small": fontSizes.small,
    "--font-sizes-medium": fontSizes.medium,
    "--font-sizes-large": fontSizes.large,
    "--font-sizes-x-large": fontSizes.xLarge,
    "--font-sizes-xx-large": fontSizes.xxLarge,
    "--font-sizes-super-large": fontSizes.superLarge,
  } as React.CSSProperties;

  return (
    <div className="App" style={appStyles}>
      <SnackbarProvider>
        <AuthProvider>
          <SidebarProvider>
            <DndProvider backend={HTML5Backend}>
              <Router>
                {/* BaseNavigator is included within Router for managing navigation and routing. */}
                {/* Additional navigators can be added here if needed. */}
                <BaseNavigator />
              </Router>
            </DndProvider>
          </SidebarProvider>
        </AuthProvider>
      </SnackbarProvider>
    </div>
  );
}

export default App;
