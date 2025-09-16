import UIKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        // Configure app appearance
        configureAppearance()
        
        // Set up window if needed (for iOS 12 and earlier)
        if #available(iOS 13.0, *) {
            // Window setup is handled by SceneDelegate
        } else {
            window = UIWindow(frame: UIScreen.main.bounds)
            let storyboard = UIStoryboard(name: "Main", bundle: nil)
            let initialViewController = storyboard.instantiateInitialViewController()
            window?.rootViewController = initialViewController
            window?.makeKeyAndVisible()
        }
        
        return true
    }
    
    private func configureAppearance() {
        // Configure navigation bar appearance
        if #available(iOS 13.0, *) {
            let appearance = UINavigationBarAppearance()
            appearance.configureWithOpaqueBackground()
            appearance.backgroundColor = UIColor.black
            appearance.titleTextAttributes = [.foregroundColor: UIColor.white]
            appearance.largeTitleTextAttributes = [.foregroundColor: UIColor.white]
            
            UINavigationBar.appearance().standardAppearance = appearance
            UINavigationBar.appearance().compactAppearance = appearance
            UINavigationBar.appearance().scrollEdgeAppearance = appearance
        } else {
            UINavigationBar.appearance().barTintColor = UIColor.black
            UINavigationBar.appearance().tintColor = UIColor.white
            UINavigationBar.appearance().titleTextAttributes = [NSAttributedString.Key.foregroundColor: UIColor.white]
        }
        
        // Configure toolbar appearance
        UIToolbar.appearance().barTintColor = UIColor.black
        UIToolbar.appearance().tintColor = UIColor.white
        
        // Configure status bar
        UIApplication.shared.statusBarStyle = .lightContent
    }

    // MARK: UISceneSession Lifecycle (iOS 13+)

    @available(iOS 13.0, *)
    func application(_ application: UIApplication, configurationForConnecting connectingSceneSession: UISceneSession, options: UIScene.ConnectionOptions) -> UISceneConfiguration {
        return UISceneConfiguration(name: "Default Configuration", sessionRole: connectingSceneSession.role)
    }

    @available(iOS 13.0, *)
    func application(_ application: UIApplication, didDiscardSceneSessions sceneSessions: Set<UISceneSession>) {
        // Called when the user discards a scene session.
    }
    
    // MARK: - Background App Refresh
    
    func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // Handle background fetch if needed
        completionHandler(.noData)
    }
    
    // MARK: - URL Handling
    
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
        // Handle custom URL schemes
        if url.scheme == "madeasy" {
            // Handle custom URL
            return true
        }
        return false
    }
}
