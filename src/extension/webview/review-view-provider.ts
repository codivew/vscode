import * as vscode from 'vscode';
import type { ExtensionMessage, WebviewMessage } from '../../shared/protocol.js';
import type { ReviewController } from '../review/review-controller.js';
import { ReviewMessageHandler } from './review-message-handler.js';
import { getInitialState } from './queries/settings.js';
import { createWebviewDocument } from './webview-document.js';

export class ReviewViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
  static readonly viewType = 'codivew.reviewView';
  private view: vscode.WebviewView | undefined;
  private readonly messages: ReviewMessageHandler;
  private readonly issueStatesSubscription: vscode.Disposable;

  constructor(
    controller: ReviewController,
    private readonly extensionUri: vscode.Uri,
  ) {
    this.messages = new ReviewMessageHandler(controller, (message) => this.post(message));
    this.issueStatesSubscription = controller.onDidChangeIssueStates((states) =>
      this.post({ type: 'issueStates', states }),
    );
  }

  resolveWebviewView(view: vscode.WebviewView): void {
    this.view = view;
    const distUri = vscode.Uri.joinPath(this.extensionUri, 'dist');
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [distUri],
    };
    view.webview.html = createWebviewDocument(view.webview, this.extensionUri, getInitialState());
    view.webview.onDidReceiveMessage((message: ExtensionMessage) => {
      void this.messages.handle(message);
    });
    view.onDidDispose(() => this.messages.dispose());
  }

  private post(message: WebviewMessage): void {
    void this.view?.webview.postMessage(message);
  }

  dispose(): void {
    this.messages.dispose();
    this.issueStatesSubscription.dispose();
  }
}
