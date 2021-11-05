package DigitalClock;

public class ClockDisplay {
    private NumberDisplay hours;
    private NumberDisplay minutes;
    private NumberDisplay seconds;
    private String currTimeString;  // the current time as a string

    public ClockDisplay()
  // intialize the clock to 00:00
  {
    hours = new NumberDisplay(24);
    minutes = new NumberDisplay(60);
    seconds = new NumberDisplay(60);
    setTimeString();
  }


  private void setTimeString()
  /* store the current time as a string    of the form "hours:minutes"  */
  {
      currTimeString = hours.getDisplayValue() + ":" + minutes.getDisplayValue()+ ":" + seconds.getDisplayValue(); 
  }

  public void setTime(int hour, int minute, int sec)
  // set time to the specified hour and minute
  {
    hours.setValue(hour);
    minutes.setValue(minute);
    seconds.setValue(sec);
    setTimeString();
  }  // end of setTime()


  public String getTime()
  // return the current time as a string
  { return currTimeString; }

  public void minIncrement()
  // increment the clock by one minute;
  // hour increments when minutes roll over to 0
  {
      seconds.increment();
      if(seconds.getValue()==0){

        minutes.increment();
        if (minutes.getValue() == 0) // mins rolled
          hours.increment();
      } 
      setTimeString();
      
  }  // end of minIncrement()


}
