package DigitalClock;

public class NumberDisplay {
    
    private int currValue;
    private int maxValue;   // number at which currValue goes back to 0
  
  
    public NumberDisplay(int max)
    { maxValue = max;
      currValue = 0;
    }
  
    public void setValue(int newValue)
    /* Set currValue to the new value. If the new value is less than zero or over maxValue, don't set it.
    */
    { if ((newValue >= 0) && (newValue < maxValue))
        currValue = newValue;
    }
  
  
    public int getValue()
    {  return currValue; }
  
    public String getDisplayValue()
    // return currValue as a string
    {
      if (currValue < 10)
        return "0" + currValue;  //pad string with leading 0
      else
        return "" + currValue;
    }
  
    public void increment()
    /* Increment currValue, rolling over to zero if the
       maxValue is reached. */
    {  currValue = (currValue + 1) % maxValue; }

}
