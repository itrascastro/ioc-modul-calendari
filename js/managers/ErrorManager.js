class ErrorManager {
    
    handleError(error) {
        if (error instanceof CalendariIOCException) {
            console.error(`[${error.context}] ${error.missatge}`);
            uiHelper.showMessage(error.missatge, 'error');
        } else {
            console.error('[UNHANDLED ERROR]', error);
            uiHelper.showMessage('Ha ocorregut un error inesperat.', 'error');
        }
    }
}

const errorManager = new ErrorManager();