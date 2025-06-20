import mlflow
import mlflow.sklearn

def log_model(model, X_train, y_train):
    mlflow.start_run()
    model.fit(X_train, y_train)
    mlflow.sklearn.log_model(model, "model")
    mlflow.log_params(model.get_params())
    mlflow.end_run()
