resource "checkly_heartbeat" "heartbeat-monitor" {
  name                      = "Heartbeat Monitor"
  activated                 = true
  muted                     = false
  tags                      = []
  heartbeat {
    period                    = 1
    period_unit               = "hours"
    grace                     = 30
    grace_unit                = "minutes"
  }
  alert_settings {
    escalation_type = "TIME_BASED"
    run_based_escalation {
      failed_run_threshold = 1
    }
    time_based_escalation {
      minutes_failing_threshold = 5
    }
    reminders {
      amount   = 0
      interval = 5
    }
  }
  use_global_alert_settings = true
}
