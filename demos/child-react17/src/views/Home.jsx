import React, { useState } from "react";
import { Container, Button, Alert } from "react-bootstrap";
import { CSSTransition } from "react-transition-group";

export default function Home() {
    const [showButton, setShowButton] = useState(true);
    const [showMessage, setShowMessage] = useState(false);
    const goOtherApp = () => {
        window.history.pushState({ name: "trade-page" }, "trade-title", "#/trade/");
        // 主动触发一次popstate事件
        window.dispatchEvent(new PopStateEvent("popstate"));
    };
    return (
        <Container style={{ paddingTop: "2rem" }}>
            <Button onClick={goOtherApp}>go Trade</Button>
            {showButton && (
                <Button onClick={() => setShowMessage(true)} size="lg">
                    Show Message
                </Button>
            )}
            <CSSTransition
                in={showMessage}
                timeout={300}
                classNames="alert"
                unmountOnExit
                onEnter={() => setShowButton(false)}
                onExited={() => setShowButton(true)}
            >
                <Alert variant="primary" dismissible onClose={() => setShowMessage(false)}>
                    <Alert.Heading>Animated alert message</Alert.Heading>
                    <p>This alert message is being transitioned in and out of the DOM.</p>
                    <Button onClick={() => setShowMessage(false)}>Close</Button>
                </Alert>
            </CSSTransition>
        </Container>
    );
}
