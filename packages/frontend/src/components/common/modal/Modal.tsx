import React, { useState, useEffect } from "react";
import ReactDom from "react-dom";
import classNames from "../../../utils/classNames";
import isMobile from "../../../utils/isMobile";
import CloseButton from "./CloseButton";
import StyledModal, { ModalSize } from "./Style.css";

const modalRoot = document.getElementById("modal-root");

export type ModalClass = "slim" | "tooltip";

interface Props {
  isOpen: boolean;
  modalSize: ModalSize;
  modalClass: ModalClass;
  closeButton: boolean;
  onClose: () => void;
  disableClose?: boolean;
  id?: string;
  mobileActionSheet?: boolean;
  children?: any;
  "data-test-id"?: string;
  style?: any;
}

const Modal: React.FunctionComponent<Props> = ({
  isOpen,
  onClose,
  id,
  modalSize,
  modalClass,
  children,
  closeButton,
  disableClose,
  mobileActionSheet = true,
  "data-test-id": testId,
  style,
}) => {
  const background = React.createRef();
  const [fadeType, setFadeType] = useState(null);
  const [fullScreen, setFullScreen] = useState(null);
  const body = document.querySelector("body");

  useEffect(() => {
    if (isMobile()) {
      checkFullScreen();
    }

    const closeEl = document.getElementById("close-button");
    closeEl?.addEventListener("click", handleClick, false);
    window.addEventListener("keydown", onEscKeyDown, false);
    const fadeIn = setTimeout(() => setFadeType("in"), 0);
    body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onEscKeyDown, false);
      closeEl?.removeEventListener("click", handleClick, false);
      clearTimeout(fadeIn);
      body.style.removeProperty("overflow");
    };
  }, []);

  useEffect(() => {
    setFadeType("out");
    if (isOpen) {
      setTimeout(() => {
        setFadeType("in");
      }, 500);
    }
  }, [isOpen]);

  const checkFullScreen = () => {
    const modalHeight = document.getElementById("modal-container").getBoundingClientRect().height;
    const clientHeight = Math.max(
      document.documentElement.clientHeight || 0,
      window.innerHeight || 0,
    );
    if (Math.round((modalHeight / clientHeight) * 100) > 90) {
      setFullScreen("full-screen");
    }
  };

  const transitionEnd = (e) => {
    if (e.propertyName !== "opacity" || fadeType === "in") {
      return;
    }

    if (fadeType === "out") {
      onClose();
    }
  };

  const onEscKeyDown = (e) => {
    if (!disableClose) {
      if (e.key !== "Escape") {
        return;
      }
      setFadeType("out");
    }
  };

  const handleClick = () => {
    if (!disableClose) {
      setFadeType("out");
    }
  };

  return ReactDom.createPortal(
    <StyledModal
      id={id}
      className={classNames([
        "modal-wrapper",
        `size-${modalSize}`,
        `fade-${fadeType}`,
        modalClass,
        fullScreen,
        { "mobile-action-sheet": mobileActionSheet },
      ])}
      role='dialog'
      modalSize={modalSize}
      onTransitionEnd={transitionEnd}
      data-test-id={testId}
      style={style}
    >
      <div id='modal-container' className='modal'>
        {closeButton && <CloseButton device={closeButton} onClick={handleClick} />}
        {children}
      </div>
      <div
        className='background'
        onMouseDown={handleClick}
        ref={background as React.RefObject<HTMLDivElement>}
      />
    </StyledModal>,
    modalRoot,
  );
};

export default Modal;
