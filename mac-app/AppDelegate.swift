import Cocoa
import WebKit

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    @IBOutlet var window: NSWindow!
    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var addressBar: NSTextField!
    @IBOutlet weak var progressIndicator: NSProgressIndicator!
    
    private var windowController: NSWindowController?

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        setupApplication()
        setupWindow()
        setupWebView()
        loadInitialURL()
    }
    
    private func setupApplication() {
        // Configure app appearance
        if #available(macOS 10.14, *) {
            NSApp.appearance = NSAppearance(named: .darkAqua)
        }
        
        // Set app icon
        if let appIcon = NSImage(named: "AppIcon") {
            NSApp.applicationIconImage = appIcon
        }
    }
    
    private func setupWindow() {
        // Create main window if not loaded from storyboard
        if window == nil {
            let contentRect = NSRect(x: 100, y: 100, width: 1200, height: 800)
            window = NSWindow(
                contentRect: contentRect,
                styleMask: [.titled, .closable, .miniaturizable, .resizable],
                backing: .buffered,
                defer: false
            )
            
            window.title = "MadEasy Browser"
            window.center()
            window.makeKeyAndOrderFront(nil)
        }
        
        // Configure window
        window.minSize = NSSize(width: 800, height: 600)
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        
        // Create window controller
        windowController = NSWindowController(window: window)
        windowController?.showWindow(nil)
    }
    
    private func setupWebView() {
        let configuration = WKWebViewConfiguration()
        configuration.allowsAirPlayForMediaPlayback = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        
        // Enable developer extras
        configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        
        webView = WKWebView(frame: window.contentView!.bounds, configuration: configuration)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsMagnification = true
        
        // Add to window
        window.contentView?.addSubview(webView)
        
        // Set up constraints
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: window.contentView!.topAnchor, constant: 80),
            webView.leadingAnchor.constraint(equalTo: window.contentView!.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: window.contentView!.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: window.contentView!.bottomAnchor)
        ])
        
        // Set up toolbar
        setupToolbar()
        
        // Add observers
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.title), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack), options: .new, context: nil)
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward), options: .new, context: nil)
    }
    
    private func setupToolbar() {
        let toolbar = NSToolbar(identifier: "MainToolbar")
        toolbar.delegate = self
        toolbar.allowsUserCustomization = true
        toolbar.autosavesConfiguration = true
        toolbar.displayMode = .iconAndLabel
        
        window.toolbar = toolbar
        
        // Create address bar
        addressBar = NSTextField(frame: NSRect(x: 0, y: 0, width: 400, height: 24))
        addressBar.placeholderString = "Enter URL or search..."
        addressBar.target = self
        addressBar.action = #selector(addressBarAction(_:))
        
        // Create progress indicator
        progressIndicator = NSProgressIndicator(frame: NSRect(x: 0, y: 0, width: 200, height: 4))
        progressIndicator.style = .bar
        progressIndicator.isIndeterminate = false
        progressIndicator.minValue = 0
        progressIndicator.maxValue = 1
        progressIndicator.isHidden = true
    }
    
    private func loadInitialURL() {
        let url = URL(string: "http://localhost:5000")!
        let request = URLRequest(url: url)
        webView.load(request)
    }
    
    // MARK: - Actions
    
    @objc func addressBarAction(_ sender: NSTextField) {
        guard !sender.stringValue.isEmpty else { return }
        
        var urlString = sender.stringValue
        if !urlString.hasPrefix("http://") && !urlString.hasPrefix("https://") {
            urlString = "https://" + urlString
        }
        
        if let url = URL(string: urlString) {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    @objc func goBack(_ sender: Any?) {
        if webView.canGoBack {
            webView.goBack()
        }
    }
    
    @objc func goForward(_ sender: Any?) {
        if webView.canGoForward {
            webView.goForward()
        }
    }
    
    @objc func reload(_ sender: Any?) {
        webView.reload()
    }
    
    @objc func stopLoading(_ sender: Any?) {
        webView.stopLoading()
    }
    
    // MARK: - Menu Actions
    
    @IBAction func newWindow(_ sender: Any?) {
        let storyboard = NSStoryboard(name: "Main", bundle: nil)
        if let windowController = storyboard.instantiateController(withIdentifier: "MainWindowController") as? NSWindowController {
            windowController.showWindow(nil)
        }
    }
    
    @IBAction func showDeveloperTools(_ sender: Any?) {
        if #available(macOS 13.3, *) {
            webView.inspector?.show()
        } else {
            // Fallback for older macOS versions
            webView.evaluateJavaScript("document.body.style.backgroundColor = 'red'") { _, _ in }
        }
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Clean up observers
        webView?.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
        webView?.removeObserver(self, forKeyPath: #keyPath(WKWebView.title))
        webView?.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoBack))
        webView?.removeObserver(self, forKeyPath: #keyPath(WKWebView.canGoForward))
    }

    func applicationSupportsSecureRestorableState(_ app: NSApplication) -> Bool {
        return true
    }
    
    // MARK: - KVO
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
            let progress = webView.estimatedProgress
            progressIndicator.doubleValue = progress
            progressIndicator.isHidden = progress >= 1.0
        } else if keyPath == #keyPath(WKWebView.title) {
            window.title = webView.title ?? "MadEasy Browser"
        } else if keyPath == #keyPath(WKWebView.canGoBack) || keyPath == #keyPath(WKWebView.canGoForward) {
            // Update toolbar button states
            window.toolbar?.validateVisibleItems()
        }
    }
}

// MARK: - WKNavigationDelegate

extension AppDelegate: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        progressIndicator.isHidden = false
        progressIndicator.doubleValue = 0.0
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        progressIndicator.isHidden = true
        addressBar.stringValue = webView.url?.absoluteString ?? ""
        window.title = webView.title ?? "MadEasy Browser"
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        progressIndicator.isHidden = true
        showErrorAlert(message: error.localizedDescription)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        progressIndicator.isHidden = true
        showErrorAlert(message: error.localizedDescription)
    }
    
    private func showErrorAlert(message: String) {
        let alert = NSAlert()
        alert.messageText = "Navigation Error"
        alert.informativeText = message
        alert.alertStyle = .warning
        alert.addButton(withTitle: "OK")
        alert.runModal()
    }
}

// MARK: - WKUIDelegate

extension AppDelegate: WKUIDelegate {
    
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil {
            webView.load(navigationAction.request)
        }
        return nil
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = NSAlert()
        alert.messageText = "JavaScript Alert"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.runModal()
        completionHandler()
    }
    
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = NSAlert()
        alert.messageText = "JavaScript Confirm"
        alert.informativeText = message
        alert.addButton(withTitle: "OK")
        alert.addButton(withTitle: "Cancel")
        let response = alert.runModal()
        completionHandler(response == .alertFirstButtonReturn)
    }
}

// MARK: - NSToolbarDelegate

extension AppDelegate: NSToolbarDelegate {
    
    func toolbar(_ toolbar: NSToolbar, itemForItemIdentifier itemIdentifier: NSToolbarItem.Identifier, willBeInsertedIntoToolbar flag: Bool) -> NSToolbarItem? {
        
        switch itemIdentifier {
        case NSToolbarItem.Identifier("BackButton"):
            let item = NSToolbarItem(itemIdentifier: itemIdentifier)
            item.label = "Back"
            item.toolTip = "Go Back"
            item.target = self
            item.action = #selector(goBack(_:))
            item.image = NSImage(systemSymbolName: "chevron.left", accessibilityDescription: "Back")
            return item
            
        case NSToolbarItem.Identifier("ForwardButton"):
            let item = NSToolbarItem(itemIdentifier: itemIdentifier)
            item.label = "Forward"
            item.toolTip = "Go Forward"
            item.target = self
            item.action = #selector(goForward(_:))
            item.image = NSImage(systemSymbolName: "chevron.right", accessibilityDescription: "Forward")
            return item
            
        case NSToolbarItem.Identifier("ReloadButton"):
            let item = NSToolbarItem(itemIdentifier: itemIdentifier)
            item.label = "Reload"
            item.toolTip = "Reload Page"
            item.target = self
            item.action = #selector(reload(_:))
            item.image = NSImage(systemSymbolName: "arrow.clockwise", accessibilityDescription: "Reload")
            return item
            
        case NSToolbarItem.Identifier("AddressBar"):
            let item = NSToolbarItem(itemIdentifier: itemIdentifier)
            item.label = "Address"
            item.view = addressBar
            item.minSize = NSSize(width: 200, height: 24)
            item.maxSize = NSSize(width: 600, height: 24)
            return item
            
        case NSToolbarItem.Identifier("ProgressIndicator"):
            let item = NSToolbarItem(itemIdentifier: itemIdentifier)
            item.view = progressIndicator
            item.minSize = NSSize(width: 100, height: 4)
            item.maxSize = NSSize(width: 200, height: 4)
            return item
            
        default:
            return nil
        }
    }
    
    func toolbarDefaultItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        return [
            NSToolbarItem.Identifier("BackButton"),
            NSToolbarItem.Identifier("ForwardButton"),
            NSToolbarItem.Identifier("ReloadButton"),
            .flexibleSpace,
            NSToolbarItem.Identifier("AddressBar"),
            .flexibleSpace,
            NSToolbarItem.Identifier("ProgressIndicator")
        ]
    }
    
    func toolbarAllowedItemIdentifiers(_ toolbar: NSToolbar) -> [NSToolbarItem.Identifier] {
        return [
            NSToolbarItem.Identifier("BackButton"),
            NSToolbarItem.Identifier("ForwardButton"),
            NSToolbarItem.Identifier("ReloadButton"),
            NSToolbarItem.Identifier("AddressBar"),
            NSToolbarItem.Identifier("ProgressIndicator"),
            .space,
            .flexibleSpace
        ]
    }
}
